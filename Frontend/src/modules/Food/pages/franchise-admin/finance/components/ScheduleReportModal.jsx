import React, { useState, useEffect } from "react";
import { Modal, Form, Select, Radio, Checkbox, TimePicker, Switch, Input, Tag, Button, Divider } from "antd";
import { Calendar, Clock, Mail, CheckCircle2, Sliders } from "lucide-react";
import dayjs from "dayjs";

const { Option } = Select;

export default function ScheduleReportModal({ visible, schedule, onClose, onSave }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState([]);
  const [emailInput, setEmailInput] = useState("");

  // Watch fields to dynamically calculate next run time preview
  const watchFrequency = Form.useWatch("frequency", form);
  const watchRunTime = Form.useWatch("runTime", form);
  const watchDelivery = Form.useWatch("deliveryMethod", form);

  useEffect(() => {
    if (visible) {
      if (schedule) {
        form.setFieldsValue({
          reportType: schedule.reportType,
          frequency: schedule.frequency,
          deliveryMethod: schedule.deliveryMethod,
          format: schedule.format,
          runTime: schedule.runTime ? dayjs(schedule.runTime, "hh:mm A") : dayjs("08:00 AM", "hh:mm A"),
          active: schedule.active
        });
        setEmailRecipients(schedule.emailRecipients || []);
      } else {
        form.setFieldsValue({
          reportType: "Sales Report",
          frequency: "Daily",
          deliveryMethod: "Both",
          format: "PDF",
          runTime: dayjs("08:00 AM", "hh:mm A"),
          active: true
        });
        setEmailRecipients([]);
      }
    }
  }, [visible, schedule, form]);

  const reportTypes = [
    "Sales Report",
    "Store Performance Report",
    "Product Sales Report",
    "Inventory Report",
    "Rider Performance Report",
    "Customer Report",
    "Finance Report"
  ];

  const handleAddEmail = () => {
    const email = emailInput.trim();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (!emailRecipients.includes(email)) {
        setEmailRecipients([...emailRecipients, email]);
      }
      setEmailInput("");
    } else if (email) {
      form.setFields([
        {
          name: "emailRecipients",
          errors: ["Please enter a valid email address."]
        }
      ]);
    }
  };

  const handleRemoveEmail = (removedEmail) => {
    setEmailRecipients(emailRecipients.filter(e => e !== removedEmail));
  };

  // Calculate simulated next run based on parameters
  const calculateNextRun = () => {
    const timeStr = watchRunTime ? watchRunTime.format("HH:mm") : "08:00";
    const [hours, minutes] = timeStr.split(":").map(Number);
    
    let next = dayjs().hour(hours).minute(minutes).second(0);
    
    // If today is already past the scheduled time, increment dayjs accordingly
    if (next.isBefore(dayjs())) {
      next = next.add(1, "day");
    }

    if (watchFrequency === "Weekly") {
      next = next.add(1, "week");
    } else if (watchFrequency === "Monthly") {
      next = next.add(1, "month");
    } else if (watchFrequency === "Quarterly") {
      next = next.add(3, "month");
    }

    return next.format("DD MMM YYYY [at] hh:mm A");
  };

  const handleFinish = async (values) => {
    setLoading(true);
    const formattedRunTime = values.runTime ? values.runTime.format("hh:mm A") : "08:00 AM";

    const finalConfig = {
      reportType: values.reportType,
      frequency: values.frequency,
      emailRecipients,
      format: values.format,
      deliveryMethod: values.deliveryMethod,
      runTime: formattedRunTime,
      active: !!values.active
    };

    try {
      await onSave(schedule ? schedule._id : null, finalConfig);
      form.resetFields();
      setEmailRecipients([]);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const needsEmailInput = watchDelivery === "Email" || watchDelivery === "Both";

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 pb-2 text-slate-800 dark:text-white border-b border-zinc-100 dark:border-zinc-800">
          <Calendar size={18} className="text-[var(--primary)]" />
          <span className="text-sm font-extrabold uppercase tracking-wide">
            {schedule ? "Modify Report Schedule" : "Schedule Automated Report"}
          </span>
        </div>
      }
      open={visible}
      onCancel={() => {
        form.resetFields();
        setEmailRecipients([]);
        onClose();
      }}
      width={900}
      footer={null}
      centered
      className="reports-modal dark:bg-zinc-900"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="mt-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          
          {/* Inputs - 3 Columns */}
          <div className="md:col-span-3 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Form.Item
                name="reportType"
                label={<span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Report Category</span>}
                rules={[{ required: true, message: "Please select report type" }]}
              >
                <Select className="w-full font-semibold">
                  {reportTypes.map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="format"
                label={<span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Output Format</span>}
                rules={[{ required: true, message: "Please select format" }]}
              >
                <Select className="w-full font-semibold">
                  <Option value="PDF">PDF document (.pdf)</Option>
                  <Option value="Excel">Microsoft Excel sheet (.xls)</Option>
                  <Option value="CSV">Comma Separated Values (.csv)</Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item
              name="frequency"
              label={<span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Automation Frequency</span>}
            >
              <Radio.Group className="flex gap-4 font-semibold">
                <Radio value="Daily">Daily</Radio>
                <Radio value="Weekly">Weekly</Radio>
                <Radio value="Monthly">Monthly</Radio>
                <Radio value="Quarterly">Quarterly</Radio>
              </Radio.Group>
            </Form.Item>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <Form.Item
                name="runTime"
                label={<span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Run Time</span>}
                rules={[{ required: true, message: "Select run time" }]}
              >
                <TimePicker use12Hours format="h:mm a" className="w-full font-semibold" />
              </Form.Item>

              <Form.Item
                name="deliveryMethod"
                label={<span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Delivery Dispatch Channel</span>}
              >
                <Select className="w-full font-semibold">
                  <Option value="Email">Email Dispatch Only</Option>
                  <Option value="Download Center">Download Center Only</Option>
                  <Option value="Both">Both (Email & Download Center)</Option>
                </Select>
              </Form.Item>
            </div>

            {needsEmailInput && (
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-2">
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block">Recipient Emails</span>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. ops-team@papavegpizza.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onPressEnter={(e) => {
                      e.preventDefault();
                      handleAddEmail();
                    }}
                    className="font-semibold text-xs"
                  />
                  <Button 
                    type="default"
                    onClick={handleAddEmail}
                    className="border-zinc-300 hover:border-[var(--primary)] font-bold text-xs"
                  >
                    Add
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {emailRecipients.map(email => (
                    <Tag
                      key={email}
                      closable
                      onClose={() => handleRemoveEmail(email)}
                      className="bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-750 text-xs font-semibold px-2 py-0.5 rounded-md"
                    >
                      {email}
                    </Tag>
                  ))}
                  {emailRecipients.length === 0 && (
                    <span className="text-[10px] font-semibold text-zinc-450 italic">No recipients added yet.</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Details & Live Preview - 2 Columns */}
          <div className="md:col-span-2 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 pb-2 border-b border-zinc-200 dark:border-zinc-850">
                <Sliders size={14} className="text-[var(--primary)]" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Schedule Parameters</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[9px] font-extrabold uppercase text-zinc-400 block">Frequency Loop</span>
                  <span className="font-bold text-zinc-850 dark:text-zinc-150">Every {watchFrequency || "Daily"}</span>
                </div>

                <div>
                  <span className="text-[9px] font-extrabold uppercase text-zinc-400 block flex items-center gap-0.5">
                    <Clock size={10} /> Next Scheduled Trigger
                  </span>
                  <span className="font-black text-[var(--primary)]">
                    {calculateNextRun()}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] font-extrabold uppercase text-zinc-400 block">Delivery Method</span>
                  <span className="font-semibold text-zinc-550 dark:text-zinc-350">{watchDelivery}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-6">
              <div className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-2.5 rounded-xl">
                <div>
                  <span className="text-[10px] font-extrabold text-zinc-800 dark:text-zinc-200 block">Active Status</span>
                  <span className="text-[8px] text-zinc-400 font-semibold block">Schedule will run in background</span>
                </div>
                <Form.Item name="active" valuePropName="checked" className="mb-0">
                  <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                </Form.Item>
              </div>

              <div className="flex items-start gap-1.5 p-2 rounded-xl bg-blue-500/5 border border-blue-500/10 text-[9px] font-semibold text-blue-600 dark:text-blue-400 leading-normal">
                <Mail size={13} className="shrink-0 mt-0.5" />
                <span>Reports are auto-compiled by background tasks and dispatched to SMTP servers in PDF/Excel format.</span>
              </div>
            </div>
          </div>
        </div>

        <Divider className="my-4" />

        <div className="flex justify-end gap-3">
          <Button 
            disabled={loading}
            onClick={() => {
              form.resetFields();
              setEmailRecipients([]);
              onClose();
            }}
            className="border-zinc-250 dark:border-zinc-850 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl h-10 px-5 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="bg-[var(--primary)] border-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-xl h-10 px-6 cursor-pointer flex items-center gap-1"
          >
            <CheckCircle2 size={14} />
            <span>Save Schedule</span>
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
