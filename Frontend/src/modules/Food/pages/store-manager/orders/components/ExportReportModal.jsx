import React, { useState } from "react";
import { Modal, Select, Input, Button, Switch, DatePicker } from "antd";
import { FileText, Mail, Download, Calendar, Settings } from "lucide-react";
import { useExportCompletedOrders } from "../hooks/useCompletedOrders";

export default function ExportReportModal({ visible, onClose }) {
  const [format, setFormat] = useState("Excel");
  const [dateRange, setDateRange] = useState("Today");
  const [emailReport, setEmailReport] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [customRange, setCustomRange] = useState(null);

  const exportMutation = useExportCompletedOrders();

  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync({
        format,
        dateRange: dateRange === "Custom" && customRange ? "Custom Range" : dateRange,
        emailReport,
        emailAddress
      });
      onClose();
    } catch (e) {
      // Handled by mutation toast
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 pr-8">
          <Download size={18} className="text-primary" />
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Export Orders Report</h3>
            <p className="text-[10px] text-zinc-400 font-semibold">Generate operations and sales reports for completed items</p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={450}
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
          loading={exportMutation.isPending}
          onClick={handleExport}
          className="!bg-primary hover:!bg-primary-hover border-0 !text-white rounded-full font-bold px-5 py-2 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer text-xs"
        >
          Export Report
        </Button>
      ]}
    >
      <div className="py-4 space-y-4">
        
        {/* Format Select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
            Report Format
          </label>
          <Select
            value={format}
            onChange={(val) => setFormat(val)}
            className="w-full h-10 rounded-xl font-semibold"
          >
            <Select.Option value="Excel">Microsoft Excel (.xlsx)</Select.Option>
            <Select.Option value="CSV">Comma Separated Values (.csv)</Select.Option>
            <Select.Option value="PDF">Portable Document Format (.pdf)</Select.Option>
          </Select>
        </div>

        {/* Date Range Select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
            Reporting Date Scope
          </label>
          <Select
            value={dateRange}
            onChange={(val) => setDateRange(val)}
            className="w-full h-10 rounded-xl font-semibold"
          >
            <Select.Option value="Today">Today's Orders</Select.Option>
            <Select.Option value="Weekly">Last 7 Days (Weekly)</Select.Option>
            <Select.Option value="Monthly">Last 30 Days (Monthly)</Select.Option>
            <Select.Option value="Custom">Custom Date Range</Select.Option>
          </Select>
        </div>

        {/* Custom Range Picker */}
        {dateRange === "Custom" && (
          <div className="flex flex-col gap-1.5 animate-fade-in">
            <label className="text-xs font-bold text-zinc-400">
              Select Start & End Dates
            </label>
            <DatePicker.RangePicker 
              className="w-full h-10 rounded-xl"
              onChange={(dates) => setCustomRange(dates)}
            />
          </div>
        )}

        {/* Email Dispatch Toggle */}
        <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-3xl border border-zinc-150 dark:border-zinc-800/60 space-y-3">
          <div className="flex justify-between items-center">
            <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">
              <span>Send Report to Email</span>
              <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Dispatches generated reports to inbox</p>
            </div>
            <Switch checked={emailReport} onChange={(val) => setEmailReport(val)} size="small" />
          </div>

          {emailReport && (
            <div className="flex flex-col gap-1.5 animate-fade-in">
              <label className="text-[10px] text-zinc-450 font-bold uppercase">
                Recipient Email Address
              </label>
              <Input
                placeholder="enter-email@papaveg.com"
                prefix={<Mail size={12} className="text-zinc-400" />}
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="rounded-xl h-10 text-xs"
              />
            </div>
          )}
        </div>

      </div>
    </Modal>
  );
}
