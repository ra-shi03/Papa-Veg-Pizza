import React, { useState, useEffect } from "react";
import { Modal, Radio, Input, Select, Button, Form, Alert, Badge } from "antd";
import { Clock, ShieldCheck, Flame, UserCheck, Keyboard } from "lucide-react";
import { useActiveSupervisors } from "../hooks/useIncomingOrders";

export default function AcceptOrderModal({ visible, onClose, order, onConfirm, loading }) {
  const [prepTimeType, setPrepTimeType] = useState("20"); // "10", "15", "20", "30", "45", "custom"
  const [customPrepTime, setCustomPrepTime] = useState(25);
  const [priority, setPriority] = useState("normal"); // "normal", "urgent"
  const [supervisorId, setSupervisorId] = useState(null);
  const [notes, setNotes] = useState("");
  const [searchSupervisor, setSearchSupervisor] = useState("");

  const [form] = Form.useForm();

  // Fetch active supervisors
  const { data: supervisors = [], isLoading: loadingSupervisors } = useActiveSupervisors(searchSupervisor);

  // Set default supervisor once loaded
  useEffect(() => {
    if (supervisors.length > 0 && !supervisorId) {
      // Auto-select supervisor with lowest load
      const sorted = [...supervisors].sort((a, b) => (a.currentActiveOrders || 0) - (b.currentActiveOrders || 0));
      setSupervisorId(sorted[0]._id);
    }
  }, [supervisors, supervisorId]);

  if (!order) return null;

  // Calculate prep minutes
  const getPrepMinutes = () => {
    return prepTimeType === "custom" ? Number(customPrepTime || 0) : Number(prepTimeType);
  };

  // Calculate Estimated Completion Time
  const getEstimatedCompletionTime = () => {
    const minutes = getPrepMinutes();
    const time = new Date();
    time.setMinutes(time.getMinutes() + minutes);
    return time.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleConfirm = () => {
    const finalPrepTime = getPrepMinutes();
    
    if (finalPrepTime <= 0) {
      form.setFields([
        {
          name: "customPrepTime",
          errors: ["Prep time must be greater than 0 minutes."]
        }
      ]);
      return;
    }

    onConfirm({
      estimatedPreparationTime: finalPrepTime,
      priority,
      kitchenSupervisorId: supervisorId,
      notes
    });
  };

  // Custom Radio Card style
  const radioCardStyle = (value, current) => {
    const isSelected = current === value;
    return `flex-1 border text-center p-3 rounded-2xl cursor-pointer hover:border-primary transition-all flex flex-col justify-center items-center ${
      isSelected
        ? "bg-primary/5 border-primary text-primary font-black scale-105 shadow-sm"
        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-350"
    }`;
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 pr-8">
          <ShieldCheck size={18} className="text-primary" />
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Accept Order</h3>
            <p className="text-[10px] text-zinc-400 font-semibold">Assign prep times and kitchen routing details</p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={550}
      centered
      destroyOnClose
      footer={[
        <Button
          key="cancel"
          onClick={onClose}
          className="text-xs font-bold border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-full px-4 py-2 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
        >
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleConfirm}
          className="text-xs font-bold !bg-primary hover:!bg-primary-hover border-0 text-white rounded-full px-4 py-2 shadow-md shadow-primary/15 active:scale-95 transition-all cursor-pointer"
        >
          Accept & Start Prep
        </Button>
      ]}
    >
      <div className="py-2.5 space-y-5 text-xs max-h-[60vh] overflow-y-auto pr-1">
        {/* Order Brief Info */}
        <Alert
          message={
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold">Order ID: #{order.orderNumber}</span>
              <span className="font-black text-primary">Grand Total: ₹{order.grandTotal}</span>
            </div>
          }
          type="info"
          showIcon
          className="rounded-2xl border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/20"
        />

        {/* 1. Preparation Time Section */}
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
            <Clock size={12} className="text-slate-400" />
            1. Estimated Preparation Time
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[10, 15, 20, 30, 45].map((time) => (
              <div
                key={time}
                onClick={() => setPrepTimeType(String(time))}
                className={radioCardStyle(String(time), prepTimeType)}
              >
                <span className="text-xs">{time}</span>
                <span className="text-[9px] opacity-70">Mins</span>
              </div>
            ))}
            <div
              onClick={() => setPrepTimeType("custom")}
              className={radioCardStyle("custom", prepTimeType)}
            >
              <span className="text-xs">Custom</span>
              <span className="text-[9px] opacity-70">Setup</span>
            </div>
          </div>

          {prepTimeType === "custom" && (
            <Form form={form} layout="vertical" className="mt-2.5 animate-fade-down">
              <Form.Item
                name="customPrepTime"
                label={<span className="text-[10px] font-extrabold text-zinc-400">Enter Prep Duration (in minutes)</span>}
                className="mb-0"
              >
                <Input
                  type="number"
                  placeholder="Minutes"
                  value={customPrepTime}
                  onChange={(e) => setCustomPrepTime(Number(e.target.value))}
                  className="rounded-xl bg-slate-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-xs font-bold focus:border-primary"
                  min={1}
                />
              </Form.Item>
            </Form>
          )}
        </div>

        {/* 2. Priority Selection */}
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
            <Flame size={12} className="text-slate-400" />
            2. Priority Tier
          </label>
          <Radio.Group
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full flex gap-3"
          >
            <Radio.Button
              value="normal"
              className={`flex-1 text-center py-2.5 rounded-xl flex items-center justify-center font-bold text-xs ${
                priority === "normal"
                  ? "bg-slate-100 border-primary text-primary border-2"
                  : "bg-white border-zinc-200"
              }`}
            >
              Normal Prep
            </Radio.Button>
            <Radio.Button
              value="urgent"
              className={`flex-1 text-center py-2.5 rounded-xl flex items-center justify-center font-black text-xs ${
                priority === "urgent"
                  ? "bg-rose-50 border-rose-500 text-rose-600 border-2"
                  : "bg-white border-zinc-200"
              }`}
            >
              🔥 Urgent (Fast Track)
            </Radio.Button>
          </Radio.Group>
        </div>

        {/* 3. Assign Kitchen Supervisor */}
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
            <UserCheck size={12} className="text-slate-400" />
            3. Kitchen Supervisor Assignment
          </label>
          <Select
            showSearch
            placeholder="Search kitchen supervisor..."
            value={supervisorId}
            onSearch={setSearchSupervisor}
            onChange={setSupervisorId}
            filterOption={false}
            loading={loadingSupervisors}
            className="w-full custom-staff-select"
            popupClassName="custom-staff-dropdown"
          >
            {supervisors.map((staff) => (
              <Select.Option key={staff._id} value={staff._id} label={staff.name}>
                <div className="flex justify-between items-center py-1 text-xs">
                  <div className="flex items-center gap-2">
                    <img
                      src={staff.avatar}
                      alt={staff.name}
                      className="w-6 h-6 rounded-full object-cover shrink-0"
                    />
                    <div>
                      <p className="font-extrabold text-slate-800 dark:text-zinc-250 leading-tight">{staff.name}</p>
                      <p className="text-[9px] text-zinc-400 font-semibold">{staff.employeeId}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge
                      status={staff.currentActiveOrders >= 3 ? "warning" : "success"}
                      text={
                        <span className="text-[10px] font-bold text-zinc-500">
                          {staff.currentActiveOrders || 0} active orders
                        </span>
                      }
                    />
                  </div>
                </div>
              </Select.Option>
            ))}
          </Select>
        </div>

        {/* 4. Notes Section */}
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
            <Keyboard size={12} className="text-slate-400" />
            4. Preparation Notes
          </label>
          <Input.TextArea
            placeholder="Enter custom instructions (e.g. Prepare without onion, extra seasoning)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 font-semibold text-xs py-2 focus:border-primary"
            rows={2}
          />
        </div>

        {/* 5. Completion Time Preview */}
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-emerald-800 dark:text-emerald-400 font-extrabold text-xs">Estimated Completion Time</p>
            <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
              Current Time + {getPrepMinutes()} mins preparation duration
            </p>
          </div>
          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 shrink-0">
            {getEstimatedCompletionTime()}
          </span>
        </div>
      </div>
    </Modal>
  );
}
