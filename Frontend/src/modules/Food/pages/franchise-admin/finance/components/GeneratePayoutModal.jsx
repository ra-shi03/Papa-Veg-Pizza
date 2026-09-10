import React, { useState, useEffect } from "react";
import { Modal, DatePicker, Select, Switch, InputNumber, Card } from "antd";
import { Landmark, AlertCircle, X } from "lucide-react";
import { mockStores } from "../mockData";

const { RangePicker } = DatePicker;

export default function GeneratePayoutModal({ isOpen, onClose, onGenerate, ridersList }) {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const [rider, setRider] = useState("All");
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [bonus, setBonus] = useState(0);
  const [penalty, setPenalty] = useState(0);

  // Preview calculations state
  const [preview, setPreview] = useState({
    deliveries: 100,
    baseSalary: 6000,
    incentive: 1500,
    bonus: 0,
    penalty: 0,
    netAmount: 7500
  });

  // Calculate preview on state change
  useEffect(() => {
    const deliveriesCount = autoCalculate ? 105 : 0;
    const baseSalary = rider === "All" ? 6000 : 6000; // Flat base
    const calculatedIncentive = autoCalculate ? deliveriesCount * 15 : 0; // ₹15/order
    const bonusVal = Number(bonus) || 0;
    const penaltyVal = Number(penalty) || 0;
    
    setPreview({
      deliveries: deliveriesCount,
      baseSalary,
      incentive: calculatedIncentive,
      bonus: bonusVal,
      penalty: penaltyVal,
      netAmount: baseSalary + calculatedIncentive + bonusVal - penaltyVal
    });
  }, [rider, autoCalculate, bonus, penalty]);

  const handleGenerateSubmit = async () => {
    if (!dateRange || dateRange.length < 2) {
      Modal.error({
        title: "Date Range Required",
        content: "Please select a valid start date and end date for the payout period."
      });
      return;
    }

    setLoading(true);
    try {
      const config = {
        startDate: dateRange[0],
        endDate: dateRange[1],
        riderId: rider,
        autoCalculate,
        bonus,
        penalty
      };

      await onGenerate(config);
      setLoading(false);
      handleReset();
      onClose();
    } catch (err) {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDateRange(null);
    setRider("All");
    setAutoCalculate(true);
    setBonus(0);
    setPenalty(0);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b pb-2 text-zinc-800 dark:text-zinc-100 font-extrabold text-sm uppercase">
          <Landmark size={16} className="text-[var(--primary)]" />
          <span>Generate Rider Payouts</span>
        </div>
      }
      open={isOpen}
      onCancel={loading ? null : onClose}
      closeIcon={<X size={16} />}
      width={900}
      footer={[
        <button
          key="cancel"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all disabled:opacity-50 cursor-pointer text-xs"
        >
          Cancel
        </button>,
        <button
          key="submit"
          onClick={handleGenerateSubmit}
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white hover:opacity-90 rounded-lg shadow-sm font-bold transition-all disabled:opacity-50 cursor-pointer text-xs ml-2 border-0"
        >
          {loading ? (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : null}
          <span>Generate Payout</span>
        </button>
      ]}
    >
      <div className="py-4 grid grid-cols-1 md:grid-cols-5 gap-6 text-xs text-zinc-700 dark:text-zinc-300 font-['Poppins']">
        <style>{`
          .ant-modal, .ant-modal-title, .ant-picker, .ant-picker-input > input, .ant-select, .ant-select-item, .ant-switch, .ant-input-number-input {
            font-family: 'Poppins', system-ui, -apple-system, sans-serif !important;
          }
        `}</style>

        {/* Form Inputs (Left side) */}
        <div className="md:col-span-3 space-y-4">
          {/* Payout Dates */}
          <div className="flex flex-col gap-1.5">
            <span className="font-bold text-zinc-500 uppercase text-[10px]">Payout Date Range *</span>
            <RangePicker
              value={dateRange}
              onChange={val => setDateRange(val)}
              className="w-full font-semibold h-[34px]"
              placeholder={["Start Date", "End Date"]}
            />
          </div>

          {/* Delivery Rider */}
          <div className="flex flex-col gap-1.5">
            <span className="font-bold text-zinc-500 uppercase text-[10px]">Rider Select</span>
            <Select value={rider} onChange={val => setRider(val)} className="w-full font-semibold h-[34px]">
              <Select.Option value="All">All Active Riders Combined</Select.Option>
              {ridersList.map(r => (
                <Select.Option key={r.id} value={r.id}>{r.name} ({r.vehicleType})</Select.Option>
              ))}
            </Select>
          </div>

          {/* Auto Calculate switch */}
          <div className="flex items-center justify-between p-3 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30">
            <div>
              <p className="font-bold text-zinc-850 dark:text-zinc-150">Auto Calculate Incentive</p>
              <span className="text-[9px] text-zinc-400">Compute commission from completed deliveries count (₹15/order)</span>
            </div>
            <Switch checked={autoCalculate} onChange={val => setAutoCalculate(val)} />
          </div>

          {/* Bonus and Penalties */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="font-bold text-zinc-500 uppercase text-[10px]">Bonus Amount (₹)</span>
              <InputNumber
                value={bonus}
                onChange={val => setBonus(val || 0)}
                min={0}
                className="w-full font-semibold"
                placeholder="₹ Prefix"
                formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={value => value.replace(/\₹\s?|(,*)/g, "")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="font-bold text-zinc-500 uppercase text-[10px]">Penalty Amount (₹)</span>
              <InputNumber
                value={penalty}
                onChange={val => setPenalty(val || 0)}
                min={0}
                className="w-full font-semibold"
                placeholder="₹ Prefix"
                formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={value => value.replace(/\₹\s?|(,*)/g, "")}
              />
            </div>
          </div>
        </div>

        {/* Preview Summary Card (Right side) */}
        <div className="md:col-span-2">
          <Card
            title={<span className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500">Live Preview (Single Rider)</span>}
            className="border shadow-xs rounded-xl h-full bg-zinc-50/50 dark:bg-zinc-900/10"
            bodyStyle={{ padding: "16px" }}
          >
            <div className="space-y-3.5 text-[10px]">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-zinc-450 font-semibold">Total Deliveries</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-150">{preview.deliveries}</span>
              </div>
              
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-zinc-450 font-semibold">Base Salary</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-150">{formatCurrency(preview.baseSalary)}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-zinc-450 font-semibold">Calculated Incentive</span>
                <span className="font-bold text-emerald-600">{formatCurrency(preview.incentive)}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-zinc-450 font-semibold">Incentive Bonus</span>
                <span className="font-bold text-blue-500">+{formatCurrency(preview.bonus)}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-zinc-450 font-semibold">Penalty Deduction</span>
                <span className="font-bold text-rose-500">-{formatCurrency(preview.penalty)}</span>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="text-zinc-850 dark:text-zinc-100 font-extrabold text-[11px] uppercase">Net Payout Amount</span>
                <span className="font-black text-emerald-700 text-sm">{formatCurrency(preview.netAmount)}</span>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-1.5 p-2 bg-amber-500/5 rounded-lg border border-amber-500/10">
              <AlertCircle size={13} className="text-amber-500 shrink-0 mt-0.5" />
              <span className="text-[8px] text-zinc-550 leading-normal">
                *The preview calculations are estimated averages per rider. Generating payouts will create pending transactions in the ledger.
              </span>
            </div>
          </Card>
        </div>
      </div>
    </Modal>
  );
}
