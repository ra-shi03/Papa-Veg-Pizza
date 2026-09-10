import React, { useState } from "react";
import { Modal, Radio, DatePicker, Select, Checkbox, Progress } from "antd";
import { Download, X } from "lucide-react";
import { toast } from "sonner";
import dayjs from "dayjs";
import { mockDeliveryPartners } from "../mockData";

const { RangePicker } = DatePicker;

export default function RiderExportModal({ isOpen, onClose, onExport }) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [format, setFormat] = useState("Excel");
  const [rider, setRider] = useState("All");
  const [status, setStatus] = useState("All");
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, "day"), dayjs()]);
  const [includeAttendance, setIncludeAttendance] = useState(true);
  const [includeEarnings, setIncludeEarnings] = useState(true);
  const [includeHistory, setIncludeHistory] = useState(true);

  const handleExportSubmit = async () => {
    setExporting(true);
    setProgress(10);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 20;
      });
    }, 250);

    try {
      const filters = {
        riderId: rider,
        status,
        dateRange: dateRange ? {
          start: dateRange[0].format("YYYY-MM-DD"),
          end: dateRange[1].format("YYYY-MM-DD")
        } : null,
        includeAttendance,
        includeEarnings,
        includeHistory
      };

      await onExport(format, filters);

      setProgress(100);
      setTimeout(() => {
        clearInterval(interval);
        setExporting(false);
        setProgress(0);
        toast.success("Rider payouts ledger exported successfully.");
        onClose();
      }, 400);
    } catch (err) {
      clearInterval(interval);
      setExporting(false);
      setProgress(0);
      toast.error("Unable to export ledger report.");
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b pb-2 text-zinc-800 dark:text-zinc-100 font-extrabold text-sm uppercase">
          <Download size={16} className="text-[var(--primary)]" />
          <span>Export Rider Payouts</span>
        </div>
      }
      open={isOpen}
      onCancel={exporting ? null : onClose}
      closeIcon={<X size={16} />}
      width={600}
      footer={[
        <button
          key="cancel"
          onClick={onClose}
          disabled={exporting}
          className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all disabled:opacity-50 cursor-pointer text-xs"
        >
          Cancel
        </button>,
        <button
          key="submit"
          onClick={handleExportSubmit}
          disabled={exporting}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white hover:opacity-90 rounded-lg shadow-sm font-bold transition-all disabled:opacity-50 cursor-pointer text-xs ml-2 border-0"
        >
          {exporting ? (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download size={14} />
          )}
          <span>Export Report</span>
        </button>
      ]}
    >
      <div className="py-4 space-y-5 text-xs text-zinc-700 dark:text-zinc-300 font-['Poppins']">
        <style>{`
          .ant-modal, .ant-modal-title, .ant-radio-button-wrapper, .ant-picker, .ant-picker-input > input, .ant-select, .ant-select-item, .ant-checkbox-wrapper, .ant-progress-text {
            font-family: 'Poppins', system-ui, -apple-system, sans-serif !important;
          }
        `}</style>
        {!exporting ? (
          <div className="space-y-4">
            {/* Format Picker */}
            <div className="flex flex-col gap-1.5">
              <span className="font-bold text-zinc-500 uppercase text-[10px]">Export Format</span>
              <Radio.Group value={format} onChange={e => setFormat(e.target.value)} buttonStyle="solid">
                <Radio.Button value="Excel" className="w-24 text-center font-semibold">Excel</Radio.Button>
                <Radio.Button value="CSV" className="w-24 text-center font-semibold">CSV</Radio.Button>
                <Radio.Button value="PDF" className="w-24 text-center font-semibold">PDF Document</Radio.Button>
              </Radio.Group>
            </div>

            {/* Date Range Picker */}
            <div className="flex flex-col gap-1.5">
              <span className="font-bold text-zinc-500 uppercase text-[10px]">Date Range</span>
              <RangePicker
                value={dateRange}
                onChange={val => setDateRange(val)}
                className="w-full font-semibold"
                placeholder={["Start Date", "End Date"]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Rider Filter */}
              <div className="flex flex-col gap-1.5">
                <span className="font-bold text-zinc-500 uppercase text-[10px]">Rider Filter</span>
                <Select value={rider} onChange={val => setRider(val)} className="w-full font-semibold">
                  <Select.Option value="All">All Active Riders</Select.Option>
                  {mockDeliveryPartners.map(r => (
                    <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>
                  ))}
                </Select>
              </div>

              {/* Payment Status Filter */}
              <div className="flex flex-col gap-1.5">
                <span className="font-bold text-zinc-500 uppercase text-[10px]">Payment Status</span>
                <Select value={status} onChange={val => setStatus(val)} className="w-full font-semibold">
                  <Select.Option value="All">All Statuses</Select.Option>
                  <Select.Option value="Paid">Paid</Select.Option>
                  <Select.Option value="Pending">Pending</Select.Option>
                  <Select.Option value="Failed">Failed</Select.Option>
                </Select>
              </div>
            </div>

            {/* Inclusions */}
            <div className="flex flex-col gap-1.5 pt-2">
              <span className="font-bold text-zinc-500 uppercase text-[10px] mb-1">Additional Attachments</span>
              <div className="grid grid-cols-3 gap-2">
                <Checkbox
                  checked={includeAttendance}
                  onChange={e => setIncludeAttendance(e.target.checked)}
                  className="font-semibold text-zinc-650"
                >
                  Include Attendance
                </Checkbox>
                <Checkbox
                  checked={includeEarnings}
                  onChange={e => setIncludeEarnings(e.target.checked)}
                  className="font-semibold text-zinc-650"
                >
                  Earnings Breakdown
                </Checkbox>
                <Checkbox
                  checked={includeHistory}
                  onChange={e => setIncludeHistory(e.target.checked)}
                  className="font-semibold text-zinc-650"
                >
                  Payment History
                </Checkbox>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center space-y-4">
            <p className="font-bold text-sm text-zinc-800 dark:text-zinc-150 animate-pulse">
              Compiling rider records & formatting {format} document...
            </p>
            <div className="max-w-xs mx-auto">
              <Progress
                percent={progress}
                status="active"
                strokeColor={{ "0%": "var(--primary)", "100%": "var(--secondary)" }}
              />
            </div>
            <p className="text-[10px] text-zinc-400">Please do not close this modal while compiling.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
