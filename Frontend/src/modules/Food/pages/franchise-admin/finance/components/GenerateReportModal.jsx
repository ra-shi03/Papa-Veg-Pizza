import React, { useState, useEffect } from "react";
import { Modal, Form, Select, DatePicker, Radio, Checkbox, Input, Space, Button, Divider, Tag } from "antd";
import { AlertCircle, FileText, Calendar, Mail, Loader2, Sparkles } from "lucide-react";
import dayjs from "dayjs";
import { mockStores } from "../mockData";

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function GenerateReportModal({ visible, onClose, onGenerate }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState([]);
  const [emailInput, setEmailInput] = useState("");
  
  // Watch fields for preview panel
  const watchReportType = Form.useWatch("reportType", form);
  const watchDateRange = Form.useWatch("dateRange", form);
  const watchFormat = Form.useWatch("format", form);
  const watchEmailAfter = Form.useWatch("emailAfterGeneration", form);

  const reportTypes = [
    "Sales Report",
    "Store Performance Report",
    "Product Sales Report",
    "Inventory Report",
    "Rider Performance Report",
    "Customer Report",
    "Finance Report"
  ];

  // Collection metadata to show in the preview section
  const collectionMappings = {
    "Sales Report": ["orders", "payments"],
    "Store Performance Report": ["stores", "store_earnings"],
    "Product Sales Report": ["products", "order_items"],
    "Inventory Report": ["ingredients", "stock_levels", "purchase_requests"],
    "Rider Performance Report": ["delivery_partners", "delivery_tracking", "rider_payouts"],
    "Customer Report": ["customers", "reviews", "loyalty_members"],
    "Finance Report": ["franchise_revenue", "expenses", "refund_requests"]
  };

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

  const handleFinish = async (values) => {
    setLoading(true);
    const startDate = values.dateRange ? values.dateRange[0].format("YYYY-MM-DD") : "";
    const endDate = values.dateRange ? values.dateRange[1].format("YYYY-MM-DD") : "";

    const finalConfig = {
      reportType: values.reportType,
      startDate,
      endDate,
      storeFilter: values.storeFilter,
      format: values.format,
      includeCharts: !!values.includeCharts,
      includeSummary: !!values.includeSummary,
      emailAfterGeneration: !!values.emailAfterGeneration,
      emailRecipients
    };

    try {
      await onGenerate(finalConfig);
      form.resetFields();
      setEmailRecipients([]);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 pb-2 text-slate-800 dark:text-white border-b border-zinc-100 dark:border-zinc-800">
          <FileText size={18} className="text-[var(--primary)]" />
          <span className="text-sm font-extrabold uppercase tracking-wide">Generate New Analytics Report</span>
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
        initialValues={{
          reportType: "Sales Report",
          storeFilter: "All Stores",
          format: "PDF",
          includeCharts: true,
          includeSummary: true,
          emailAfterGeneration: false
        }}
        onFinish={handleFinish}
        className="mt-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Main Controls - 3 Columns */}
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
                name="storeFilter"
                label={<span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Store Filter</span>}
              >
                <Select className="w-full font-semibold">
                  <Option value="All Stores">All Stores (Bhopal & Indore)</Option>
                  {mockStores.map(store => (
                    <Option key={store.id} value={store.name}>{store.name.replace("Papa Veg Pizza - ", "")}</Option>
                  ))}
                </Select>
              </Form.Item>
            </div>

            <Form.Item
              name="dateRange"
              label={<span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Date Range (Required)</span>}
              rules={[{ required: true, message: "Please select date range" }]}
            >
              <RangePicker 
                className="w-full font-semibold"
                disabledDate={current => current && current > dayjs().endOf("day")}
              />
            </Form.Item>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <Form.Item
                name="format"
                label={<span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Output format</span>}
              >
                <Radio.Group className="flex flex-col gap-2 font-semibold">
                  <Radio value="PDF">PDF document (.pdf)</Radio>
                  <Radio value="Excel">Microsoft Excel sheet (.xls)</Radio>
                  <Radio value="CSV">Comma Separated Values (.csv)</Radio>
                </Radio.Group>
              </Form.Item>

              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 block mb-1">Inclusions</span>
                <Form.Item name="includeCharts" valuePropName="checked" className="mb-1">
                  <Checkbox className="font-bold text-zinc-700 dark:text-zinc-300">Include charts</Checkbox>
                </Form.Item>
                <Form.Item name="includeSummary" valuePropName="checked" className="mb-1">
                  <Checkbox className="font-bold text-zinc-700 dark:text-zinc-300">Include summary overview</Checkbox>
                </Form.Item>
              </div>
            </div>

            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <Form.Item name="emailAfterGeneration" valuePropName="checked">
                <Checkbox className="font-bold text-zinc-700 dark:text-zinc-300">Email Report after generation</Checkbox>
              </Form.Item>

              {watchEmailAfter && (
                <div className="space-y-2 p-3 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl border border-zinc-150 dark:border-zinc-800 animate-fade-down">
                  <span className="text-[10px] font-extrabold uppercase text-zinc-400 block">Recipient Emails</span>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. manager@papavegpizza.com"
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
                      <span className="text-[10px] font-semibold text-zinc-450 italic">No recipients added yet. Press Enter or click Add.</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Preview Panel - 2 Columns */}
          <div className="md:col-span-2 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <Sparkles size={14} className="text-[var(--primary)] animate-pulse" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Live Config Summary</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[9px] font-extrabold uppercase text-zinc-400 block">Report Type</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{watchReportType || "Not Selected"}</span>
                </div>

                <div>
                  <span className="text-[9px] font-extrabold uppercase text-zinc-400 block">Date Scope</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    {watchDateRange 
                      ? `${watchDateRange[0].format("DD MMM, YYYY")} to ${watchDateRange[1].format("DD MMM, YYYY")}`
                      : "Required selection"}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] font-extrabold uppercase text-zinc-400 block">Output Format</span>
                  <Tag className="bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20 font-extrabold text-[10px] uppercase mt-0.5">
                    {watchFormat || "PDF"}
                  </Tag>
                </div>

                <div>
                  <span className="text-[9px] font-extrabold uppercase text-zinc-400 block">Connected Databases</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(collectionMappings[watchReportType] || []).map(col => (
                      <span key={col} className="bg-zinc-200 dark:bg-zinc-800 text-[10px] font-bold px-1.5 py-0.5 rounded text-zinc-650 dark:text-zinc-350">
                        {col}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[9px] font-extrabold uppercase text-zinc-400 block">Est. Compile Size</span>
                  <span className="font-bold text-zinc-500">~1.8 MB - 3.2 MB</span>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-250 dark:border-zinc-800 pt-4 mt-6">
              <div className="flex items-start gap-1.5 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[10px] font-semibold text-amber-600 dark:text-amber-400 leading-normal">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>Generating sends a compile task to the BullMQ background worker queue. It may take a moment to compile.</span>
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
            className="border-zinc-250 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl h-10 px-5 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="bg-[var(--primary)] border-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-xl h-10 px-6 cursor-pointer flex items-center gap-1.5"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            <span>Generate Report</span>
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
