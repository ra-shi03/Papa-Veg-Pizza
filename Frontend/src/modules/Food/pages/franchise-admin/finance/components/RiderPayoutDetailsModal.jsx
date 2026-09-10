import React from "react";
import { Modal, Tabs, Card, Table, Tag } from "antd";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend
} from "recharts";
import {
  TrendingUp,
  ShoppingBag,
  Percent,
  TrendingDown,
  Info,
  DollarSign,
  PieChart as PieIcon,
  RotateCcw,
  Clock,
  Activity,
  Calendar,
  Phone,
  Truck,
  X
} from "lucide-react";

export default function RiderPayoutDetailsModal({
  isOpen,
  onClose,
  payoutDetails,
  onOpenMarkPaid,
  onExport
}) {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  if (!payoutDetails) return null;

  const {
    _id,
    payoutNumber,
    startDate,
    endDate,
    totalDeliveries,
    baseSalary,
    incentive,
    bonus,
    penalties,
    totalAmount,
    paymentStatus,
    paidDate,
    paymentMethod,
    riderName,
    phone,
    vehicle,
    rating,
    attendanceInfo,
    previousPayouts,
    performance
  } = payoutDetails;

  const getStatusColor = (status) => {
    switch (status) {
      case "Paid": return "success";
      case "Pending": return "warning";
      case "Failed": return "error";
      default: return "default";
    }
  };

  // 1. Overview Tab Content
  const overviewCards = [
    { title: "Rider Name", value: riderName, sub: "Registered Partner", icon: Info, color: "text-blue-500 bg-blue-50" },
    { title: "Phone Number", value: phone, sub: "Contact Details", icon: Phone, color: "text-indigo-500 bg-indigo-50" },
    { title: "Vehicle Type", value: vehicle, sub: "Delivery Mode", icon: Truck, color: "text-purple-500 bg-purple-50" },
    { title: "Payout Number", value: payoutNumber, sub: "Transaction ID Reference", icon: Info, color: "text-zinc-500 bg-zinc-50" },
    { title: "Date Range", value: `${startDate} - ${endDate}`, sub: "Payout settlement period", icon: Calendar, color: "text-amber-500 bg-amber-50" },
    { title: "Settlement Status", value: <Tag color={getStatusColor(paymentStatus)} className="font-extrabold text-[9px] uppercase">{paymentStatus}</Tag>, sub: "Status in database", icon: Activity, color: "text-zinc-500 bg-zinc-50" },
    { title: "Paid Date", value: paidDate || "Awaiting Settlement", sub: "Payment release date", icon: Calendar, color: "text-emerald-500 bg-emerald-50" },
    { title: "Payment Method", value: paymentMethod || "Not settled yet", sub: "Disbursement Mode", icon: DollarSign, color: "text-cyan-500 bg-cyan-50" }
  ];

  // 2. Performance Tab Content
  const perfCards = [
    { title: "Total Deliveries", value: performance.totalDeliveries, sub: "Assigned orders", icon: ShoppingBag, color: "text-indigo-500 bg-indigo-50" },
    { title: "Completed Deliveries", value: performance.completed, sub: "Successful orders", icon: TrendingUp, color: "text-emerald-500 bg-emerald-50" },
    { title: "Average Customer Rating", value: `${performance.avgRating} / 5.0`, sub: "Feedback rating", icon: Info, color: "text-amber-500 bg-amber-50" },
    { title: "Attendance Rate", value: `${performance.attendancePct}%`, sub: "Work participation rate", icon: Percent, color: "text-purple-500 bg-purple-50" },
    { title: "Cancelled Deliveries", value: performance.cancelled, sub: "Cancelled / rejected", icon: TrendingDown, color: "text-rose-500 bg-rose-50" },
    { title: "Late Deliveries", value: performance.late, sub: "Delayed drop-offs", icon: Clock, color: "text-orange-500 bg-orange-50" }
  ];

  // Daily deliveries trend chart data
  const deliveriesTrendData = [
    { day: "Jun 01", count: 8 },
    { day: "Jun 03", count: 12 },
    { day: "Jun 05", count: 9 },
    { day: "Jun 07", count: 15 },
    { day: "Jun 09", count: 10 },
    { day: "Jun 11", count: 14 },
    { day: "Jun 13", count: 11 },
    { day: "Jun 15", count: 13 }
  ];

  // 3. Earnings Breakdown Tab Content
  const salaryDistribution = [
    { name: "Base Salary", value: baseSalary, color: "#3b82f6" },
    { name: "Incentive", value: incentive, color: "#10b981" },
    { name: "Bonus", value: bonus, color: "#8b5cf6" },
    { name: "Penalty Deduction", value: penalties, color: "#ef4444" }
  ];

  // 4. Payment History Tab Columns
  const historyColumns = [
    { title: "Payout Number", dataIndex: "payoutNumber", key: "payoutNumber", className: "font-bold text-zinc-650" },
    {
      title: "Settlement Month",
      key: "month",
      render: (_, record) => {
        const d = new Date(record.endDate);
        return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
      }
    },
    { title: "Deliveries", dataIndex: "totalDeliveries", key: "totalDeliveries", align: "center" },
    { title: "Net Amount", dataIndex: "totalAmount", key: "totalAmount", render: val => <span className="font-semibold text-emerald-600">{formatCurrency(val)}</span> },
    {
      title: "Payment Status",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: st => <Tag color={getStatusColor(st)} className="font-extrabold text-[9px] uppercase">{st}</Tag>
    }
  ];

  // 5. Attendance Tab Mock Calendar heat Grid (15 Days settlement period)
  const attendanceCalendarDays = Array.from({ length: 15 }).map((_, i) => {
    const dayNum = i + 1;
    // Simulate present/absent/late
    let status = "Present";
    if (dayNum === 4 || dayNum === 11) status = "Absent";
    else if (dayNum === 8) status = "Late";

    return {
      day: `June ${dayNum < 10 ? '0' + dayNum : dayNum}`,
      status
    };
  });

  const tabsItems = [
    {
      key: "overview",
      label: "Overview",
      children: (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          {overviewCards.map((c, i) => {
            const Icon = c.icon;
            return (
              <Card key={i} size="small" className="shadow-xs border rounded-xl" bodyStyle={{ padding: "16px" }}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-zinc-400 uppercase text-[9px] font-black tracking-wider">{c.title}</span>
                    <h3 className="text-sm font-black mt-1 text-zinc-800 dark:text-zinc-100">{c.value}</h3>
                    <span className="text-[9.5px] text-zinc-400 block mt-0.5 font-semibold">{c.sub}</span>
                  </div>
                  <div className={`p-2 rounded-lg ${c.color}`}>
                    <Icon size={15} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )
    },
    {
      key: "performance",
      label: "Rider Performance",
      children: (
        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {perfCards.map((c, i) => {
              const Icon = c.icon;
              return (
                <Card key={i} size="small" className="shadow-xs border rounded-xl" bodyStyle={{ padding: "12px" }}>
                  <div className="flex flex-col gap-1">
                    <span className="text-zinc-400 uppercase text-[8px] font-black tracking-wider">{c.title}</span>
                    <h3 className="text-base font-black text-zinc-800 dark:text-zinc-150">{c.value}</h3>
                    <span className="text-[9px] text-zinc-400 font-semibold">{c.sub}</span>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="p-4 border rounded-xl shadow-xs">
            <h4 className="font-extrabold text-[10px] uppercase text-zinc-500 tracking-wider mb-3">Daily Deliveries Trend</h4>
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <LineChart data={deliveriesTrendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis dataKey="day" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ fontSize: "10px" }} />
                  <Line type="monotone" dataKey="count" name="Deliveries" stroke="var(--primary)" strokeWidth={2.2} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )
    },
    {
      key: "earnings",
      label: "Earnings Breakdown",
      children: (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center pt-2">
          <div className="md:col-span-3 space-y-4">
            <h4 className="font-extrabold text-[10px] uppercase text-zinc-500 tracking-wider">Salary Settlements & Ratios</h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30">
                <span className="text-zinc-400 uppercase text-[8px] font-bold block">Base Salary</span>
                <span className="text-sm font-black text-blue-600 mt-1 block">{formatCurrency(baseSalary)}</span>
              </div>

              <div className="p-3 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30">
                <span className="text-zinc-400 uppercase text-[8px] font-bold block">Calculated Incentive</span>
                <span className="text-sm font-black text-emerald-600 mt-1 block">{formatCurrency(incentive)}</span>
              </div>

              <div className="p-3 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30">
                <span className="text-zinc-400 uppercase text-[8px] font-bold block">Incentive Bonus</span>
                <span className="text-sm font-black text-purple-600 mt-1 block">+{formatCurrency(bonus)}</span>
              </div>

              <div className="p-3 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30">
                <span className="text-zinc-400 uppercase text-[8px] font-bold block">Penalty Deduct</span>
                <span className="text-sm font-black text-rose-500 mt-1 block">-{formatCurrency(penalties)}</span>
              </div>

              <div className="p-3 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30">
                <span className="text-zinc-400 uppercase text-[8px] font-bold block">Per Delivery commission</span>
                <span className="text-sm font-black text-zinc-700 dark:text-zinc-200 mt-1 block">₹15.00</span>
              </div>

              <div className="p-3 border rounded-xl bg-emerald-500/5 border-l-4 border-l-emerald-500">
                <span className="text-emerald-800 dark:text-emerald-400 uppercase text-[8px] font-bold block">Net Amount</span>
                <span className="text-sm font-black text-emerald-600 mt-1 block">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900 border rounded-xl">
              <span className="font-extrabold text-[9px] uppercase text-zinc-400 block mb-1.5 font-mono">Settlement Formula</span>
              <code className="text-[10px] font-bold text-zinc-700 dark:text-zinc-350 block leading-normal">
                Net Payout = Base Salary (₹6,000) + Commission (Deliveries × ₹15) + Bonus - Penalty
              </code>
            </div>
          </div>

          <div className="md:col-span-2 h-[240px] w-full p-4 border rounded-xl relative">
            <span className="font-bold text-zinc-400 uppercase text-[9px] mb-2 block text-center">Salary Distribution Share</span>
            <ResponsiveContainer width="100%" height="80%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={salaryDistribution.filter(s => s.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {salaryDistribution.filter(s => s.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={v => [formatCurrency(v), "Amount"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )
    },
    {
      key: "history",
      label: "Payment History",
      children: (
        <div className="pt-2">
          <h4 className="font-extrabold text-[10px] uppercase text-zinc-500 tracking-wider mb-3">Settled Payouts History Logs</h4>
          <Table
            dataSource={previousPayouts}
            columns={historyColumns}
            rowKey="_id"
            pagination={{ pageSize: 5 }}
            size="small"
            bordered
            locale={{ emptyText: "No previous payments history found for this delivery partner." }}
          />
        </div>
      )
    },
    {
      key: "attendance",
      label: "Attendance Logs",
      children: (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-2">
          <div className="md:col-span-2 space-y-4">
            <h4 className="font-extrabold text-[10px] uppercase text-zinc-500 tracking-wider">Attendance statistics</h4>
            <div className="grid grid-cols-2 gap-3 text-zinc-700 dark:text-zinc-300">
              <div className="p-3 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30">
                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block">Present Days</span>
                <span className="text-base font-black text-emerald-600 mt-1 block">{attendanceInfo.presentDays} Days</span>
              </div>
              <div className="p-3 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30">
                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block">Absent Days</span>
                <span className="text-base font-black text-rose-500 mt-1 block">{attendanceInfo.absentDays} Days</span>
              </div>
              <div className="p-3 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30">
                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block">Late Days</span>
                <span className="text-base font-black text-amber-500 mt-1 block">{attendanceInfo.lateDays} Days</span>
              </div>
              <div className="p-3 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30">
                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block">Working Hours</span>
                <span className="text-base font-black text-zinc-700 mt-1 block">{attendanceInfo.workingHours} Hours</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 border rounded-xl p-4 shadow-xs">
            <h4 className="font-extrabold text-[10px] uppercase text-zinc-500 tracking-wider mb-3">Settlement Cycle Attendance Heatmap</h4>
            <div className="grid grid-cols-5 gap-2">
              {attendanceCalendarDays.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border text-center font-bold flex flex-col justify-between items-center gap-1 ${
                    item.status === "Present"
                      ? "border-emerald-200 bg-emerald-500/5 text-emerald-600"
                      : item.status === "Absent"
                        ? "border-rose-200 bg-rose-500/5 text-rose-500"
                        : "border-amber-200 bg-amber-500/5 text-amber-500"
                  }`}
                >
                  <span className="text-[8px] font-bold opacity-70 block">{item.day}</span>
                  <span className="text-[7.5px] uppercase font-black tracking-wider block">{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b pb-2 text-zinc-800 dark:text-zinc-100 font-extrabold text-sm uppercase">
          <Activity size={16} className="text-[var(--primary)] animate-pulse" />
          <span>Rider Payout Settlement Details — {riderName}</span>
          <Tag color={paymentStatus === "Paid" ? "success" : "warning"} className="text-[9px] uppercase font-bold ml-2">
            {paymentStatus}
          </Tag>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      closeIcon={<X size={16} />}
      width={1300}
      footer={[
        <button
          key="close"
          onClick={onClose}
          className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all cursor-pointer text-xs"
        >
          Close
        </button>,
        ...(paymentStatus !== "Paid" ? [<button
          key="pay"
          onClick={() => {
            onClose();
            onOpenMarkPaid();
          }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs ml-2 border-0"
        >
          Mark Paid
        </button>] : []),
        <button
          key="export"
          onClick={() => {
            onExport("PDF", { id: _id });
          }}
          className="px-4 py-2 bg-[var(--primary)] text-white hover:opacity-90 rounded-lg shadow-sm font-bold transition-all cursor-pointer text-xs ml-2 border-0"
        >
          Export Statement
        </button>
      ]}
    >
      <div className="py-2 text-xs font-['Poppins']">
        <style>{`
          .ant-modal, .ant-modal-title, .ant-tabs-tab-btn, .ant-table, .ant-table-cell, .ant-tag {
            font-family: 'Poppins', system-ui, -apple-system, sans-serif !important;
          }
        `}</style>
        <Tabs items={tabsItems} className="font-semibold text-xs" />
      </div>
    </Modal>
  );
}
