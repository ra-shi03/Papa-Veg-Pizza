import React from "react";
import { Drawer, Table, Tag, Tooltip, Progress, Skeleton, Card } from "antd";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ChartTooltip, Legend 
} from "recharts";
import { 
  Send, CheckCircle2, XCircle, Eye, MousePointerClick, 
  Percent, ArrowUpRight, Smartphone, Mail, Info, Search, AlertCircle,
  Monitor
} from "lucide-react";
import dayjs from "dayjs";

export default function NotificationAnalyticsDrawer({
  visible,
  onClose,
  notification,
  loadingAnalytics,
  analyticsData,
  logsList,
  logSearch,
  setLogSearch,
  logPage,
  setLogPage,
  logLimit,
  setLogLimit
}) {
  if (!notification) return null;

  // Defensive fallback object
  const aggregates = {
    sent: Number(analyticsData?.aggregates?.sent ?? 0),
    delivered: Number(analyticsData?.aggregates?.delivered ?? 0),
    failed: Number(analyticsData?.aggregates?.failed ?? 0),
    opened: Number(analyticsData?.aggregates?.opened ?? 0),
    clicked: Number(analyticsData?.aggregates?.clicked ?? 0),
    openRate: Number(analyticsData?.aggregates?.openRate ?? 0),
    ctr: Number(analyticsData?.aggregates?.ctr ?? 0)
  };

  const pieChartData = Array.isArray(analyticsData?.pieChartData) ? analyticsData.pieChartData : [];
  const deviceData = Array.isArray(analyticsData?.deviceData) ? analyticsData.deviceData : [];
  const storeData = Array.isArray(analyticsData?.storeData) ? analyticsData.storeData : [];
  const logs = Array.isArray(logsList?.list) ? logsList.list : [];
  const logsTotal = Number(logsList?.totalCount ?? 0);

  // Avoid rendering Recharts Pie chart when there is no data or values are all 0 (causes division-by-zero NaN layout crashes)
  const hasChartData = React.useMemo(() => {
    return pieChartData.length > 0 && pieChartData.some(entry => Number(entry.value || 0) > 0);
  }, [pieChartData]);

  // Logs table columns
  const logColumns = [
    {
      title: <span className="text-[10px] font-black uppercase text-zinc-400">Customer</span>,
      dataIndex: "customerName",
      key: "customerName",
      render: (text) => <span className="text-xs font-black text-slate-800 dark:text-zinc-200">{text}</span>
    },
    {
      title: <span className="text-[10px] font-black uppercase text-zinc-400">Channel</span>,
      dataIndex: "channel",
      key: "channel",
      render: (channel) => {
        let color = "blue";
        if (channel === "sms") color = "green";
        if (channel === "email") color = "purple";
        return (
          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
            channel === "push" ? "bg-blue-50 text-blue-600" :
            channel === "sms" ? "bg-emerald-50 text-emerald-600" : "bg-purple-50 text-purple-600"
          }`}>
            {channel}
          </span>
        );
      }
    },
    {
      title: <span className="text-[10px] font-black uppercase text-zinc-400">Delivery Status</span>,
      dataIndex: "sentStatus",
      key: "sentStatus",
      render: (status) => (
        <span className={`inline-flex items-center gap-1 text-[9px] font-bold ${
          status === "delivered" ? "text-emerald-600" : "text-rose-600"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status === "delivered" ? "bg-emerald-500" : "bg-rose-500"}`}></span>
          {status}
        </span>
      )
    },
    {
      title: <span className="text-[10px] font-black uppercase text-zinc-400">Opened</span>,
      dataIndex: "opened",
      key: "opened",
      render: (opened) => (
        <span className={`text-[10px] font-bold ${opened ? "text-blue-600" : "text-zinc-400"}`}>
          {opened ? "Yes" : "No"}
        </span>
      )
    },
    {
      title: <span className="text-[10px] font-black uppercase text-zinc-400">Clicked</span>,
      dataIndex: "clicked",
      key: "clicked",
      render: (clicked) => (
        <span className={`text-[10px] font-bold ${clicked ? "text-purple-600 font-extrabold" : "text-zinc-400"}`}>
          {clicked ? "Yes" : "No"}
        </span>
      )
    },
    {
      title: <span className="text-[10px] font-black uppercase text-zinc-400">Delivered At</span>,
      dataIndex: "deliveredAt",
      key: "deliveredAt",
      render: (date) => (
        <span className="text-[10px] text-zinc-450 dark:text-zinc-550 font-semibold font-mono">
          {date ? dayjs(date).format("DD MMM, hh:mm A") : "—"}
        </span>
      )
    }
  ];

  // Store performance table columns
  const storeColumns = [
    {
      title: <span className="text-[9px] font-black uppercase text-zinc-400">Franchise Store</span>,
      dataIndex: "store",
      key: "store",
      render: (text) => <span className="text-xs font-black text-slate-800 dark:text-zinc-200">{text}</span>
    },
    {
      title: <span className="text-[9px] font-black uppercase text-zinc-400 text-center block">Delivered</span>,
      dataIndex: "delivered",
      key: "delivered",
      align: "center",
      render: (val) => <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-450">{val}</span>
    },
    {
      title: <span className="text-[9px] font-black uppercase text-zinc-400 text-center block">Opened</span>,
      dataIndex: "opened",
      key: "opened",
      align: "center",
      render: (val) => <span className="text-xs font-semibold text-zinc-650 dark:text-zinc-450">{val}</span>
    },
    {
      title: <span className="text-[9px] font-black uppercase text-zinc-400 text-center block">Clicked</span>,
      dataIndex: "clicked",
      key: "clicked",
      align: "center",
      render: (val) => <span className="text-xs font-black text-slate-800 dark:text-zinc-200">{val}</span>
    },
    {
      title: <span className="text-[9px] font-black uppercase text-zinc-400 text-right block">CTR (Click Rate)</span>,
      dataIndex: "ctr",
      key: "ctr",
      align: "right",
      render: (val) => (
        <span className="text-xs font-black text-purple-600 bg-purple-50 dark:bg-purple-950/20 px-2 py-0.5 rounded">
          {val}%
        </span>
      )
    }
  ];

  return (
    <Drawer
      title={
        <div className="flex flex-col font-['Poppins'] text-left">
          <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">
            Notification Performance Center
          </span>
          <span className="text-[10px] text-zinc-400 font-semibold mt-0.5">
            Campaign: "{notification.title}"
          </span>
        </div>
      }
      placement="right"
      width={850}
      onClose={onClose}
      open={visible}
      destroyOnClose
      bodyStyle={{ padding: "16px", backgroundColor: "#f8fafc" }}
      className="dark:bg-zinc-900 dark:text-zinc-100 font-['Poppins']"
    >
      {notification.status !== "sent" ? (
        /* Empty analytics for draft/scheduled notifications */
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-850 p-8 max-w-md mx-auto mt-10">
          <div className="p-4 rounded-full bg-zinc-50 dark:bg-zinc-900 text-zinc-400 mb-4 animate-pulse">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">No Analytics Data Available</h3>
          <p className="text-[11px] text-zinc-450 dark:text-zinc-500 font-semibold mt-2 leading-relaxed">
            This notification campaign status is currently <span className="font-bold uppercase text-[var(--primary)]">"{notification.status}"</span>. Analytics trackers and customer delivery logs are only generated after the notification has been actively sent.
          </p>
        </div>
      ) : loadingAnalytics ? (
        /* SKELETON LOADERS */
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} active paragraph={{ rows: 1 }} className="bg-white p-3 rounded-xl border" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton active paragraph={{ rows: 6 }} className="bg-white p-4 rounded-2xl border" />
            <Skeleton active paragraph={{ rows: 6 }} className="bg-white p-4 rounded-2xl border" />
          </div>
        </div>
      ) : (
        /* DETAILED ANALYTICS VIEW */
        <div className="space-y-6 text-xs font-['Poppins'] pb-12">
          
          {/* 1. KPI CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-xl shadow-3xs flex flex-col justify-between">
              <span className="text-[8px] font-black uppercase text-zinc-400 flex items-center gap-1"><Send size={10} /> Dispatched</span>
              <h3 className="text-sm font-black text-slate-900 dark:text-white mt-1">{aggregates.sent}</h3>
              <span className="text-[7.5px] text-zinc-400 font-bold">100% Volume</span>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-xl shadow-3xs flex flex-col justify-between">
              <span className="text-[8px] font-black uppercase text-zinc-400 flex items-center gap-1 text-emerald-600"><CheckCircle2 size={10} /> Delivered</span>
              <h3 className="text-sm font-black text-emerald-600 mt-1">{aggregates.delivered}</h3>
              <span className="text-[7.5px] text-emerald-500 font-bold">Success rate</span>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-xl shadow-3xs flex flex-col justify-between">
              <span className="text-[8px] font-black uppercase text-zinc-400 flex items-center gap-1 text-rose-600"><XCircle size={10} /> Failed</span>
              <h3 className="text-sm font-black text-rose-600 mt-1">{aggregates.failed}</h3>
              <span className="text-[7.5px] text-rose-500 font-bold">Bounced</span>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-xl shadow-3xs flex flex-col justify-between">
              <span className="text-[8px] font-black uppercase text-zinc-400 flex items-center gap-1 text-blue-600"><Eye size={10} /> Opened</span>
              <h3 className="text-sm font-black text-blue-600 mt-1">{aggregates.opened}</h3>
              <span className="text-[7.5px] text-zinc-400 font-bold">Unique opens</span>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-xl shadow-3xs flex flex-col justify-between">
              <span className="text-[8px] font-black uppercase text-zinc-400 flex items-center gap-1 text-purple-650"><MousePointerClick size={10} /> Clicked</span>
              <h3 className="text-sm font-black text-purple-600 mt-1">{aggregates.clicked}</h3>
              <span className="text-[7.5px] text-zinc-400 font-bold">Link interactions</span>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-xl shadow-3xs flex flex-col justify-between">
              <span className="text-[8px] font-black uppercase text-zinc-400 flex items-center gap-1 text-blue-600"><Percent size={10} /> Open Rate</span>
              <h3 className="text-sm font-black text-blue-600 mt-1">{aggregates.openRate}%</h3>
              <span className="text-[7.5px] text-emerald-500 font-bold flex items-center gap-0.5"><ArrowUpRight size={8} /> +3.2% vs avg</span>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-xl shadow-3xs flex flex-col justify-between">
              <span className="text-[8px] font-black uppercase text-zinc-400 flex items-center gap-1 text-purple-600"><Percent size={10} /> CTR</span>
              <h3 className="text-sm font-black text-purple-600 mt-1">{aggregates.ctr}%</h3>
              <span className="text-[7.5px] text-emerald-500 font-bold flex items-center gap-0.5"><ArrowUpRight size={8} /> +1.4% vs avg</span>
            </div>

          </div>

          {/* 2. PIE CHART & ENGAGEMENT GAUGES SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Pie Chart Card */}
            <Card 
              size="small"
              title={<span className="text-[9px] font-black uppercase text-zinc-400">Delivery Distribution</span>}
              className="md:col-span-6 shadow-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950"
            >
              <div className="h-[180px] w-full flex items-center justify-center">
                {hasChartData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip 
                        formatter={(val) => [`${val} Recipients`, "Count"]}
                        contentStyle={{ fontFamily: "Poppins", fontSize: "10px", borderRadius: "8px" }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={32}
                        iconSize={10}
                        formatter={(value) => <span className="text-[9px] font-black uppercase text-zinc-400 font-['Poppins']">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-4">
                    <div className="w-12 h-12 rounded-full border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-400 mb-2">
                      <AlertCircle size={18} />
                    </div>
                    <span className="text-[10px] font-black text-slate-700 dark:text-zinc-300 uppercase">No Delivery Logs</span>
                    <span className="text-[8px] text-zinc-450 dark:text-zinc-500 font-semibold mt-0.5">Logs will appear once sent</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Engagement Gauges */}
            <Card 
              size="small"
              title={<span className="text-[9px] font-black uppercase text-zinc-400">Engagement rates</span>}
              className="md:col-span-6 shadow-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950"
            >
              <div className="h-[180px] flex flex-col justify-center space-y-4 px-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-extrabold text-zinc-550 flex items-center gap-1"><Eye size={12} className="text-blue-500" /> Open Rate percentage</span>
                    <span className="font-black text-blue-600">{aggregates.openRate}%</span>
                  </div>
                  <Progress percent={aggregates.openRate} strokeColor="#3b82f6" showInfo={false} size="small" />
                  <span className="block text-[8px] text-zinc-400 font-semibold">{aggregates.opened} out of {aggregates.delivered} delivered opened</span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-extrabold text-zinc-550 flex items-center gap-1"><MousePointerClick size={12} className="text-purple-500" /> Click-Through Rate (CTR)</span>
                    <span className="font-black text-purple-650">{aggregates.ctr}%</span>
                  </div>
                  <Progress percent={aggregates.ctr} strokeColor="#a855f7" showInfo={false} size="small" />
                  <span className="block text-[8px] text-zinc-400 font-semibold">{aggregates.clicked} links clicked from {aggregates.delivered} delivered notices</span>
                </div>
              </div>
            </Card>
          </div>

          {/* 3. STORES & DEVICE ANALYTICS */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Top performing stores table */}
            <Card 
              size="small"
              title={<span className="text-[9px] font-black uppercase text-zinc-400">Store-wise Performance</span>}
              className="md:col-span-7 shadow-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 overflow-hidden"
            >
              <Table 
                dataSource={storeData}
                columns={storeColumns}
                rowKey="store"
                pagination={false}
                size="small"
                className="ant-table-custom"
              />
            </Card>

            {/* Device-wise analytics cards */}
            <Card 
              size="small"
              title={<span className="text-[9px] font-black uppercase text-zinc-400">Device Breakdown</span>}
              className="md:col-span-5 shadow-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950"
            >
              <div className="space-y-3.5 pt-2">
                {deviceData.map((d, i) => (
                  <div key={i} className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-150 dark:border-zinc-850 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white dark:bg-zinc-950 border text-zinc-500">
                        {d.device === "Android" ? <Smartphone size={14} className="text-emerald-500" /> :
                         d.device === "iOS" ? <Smartphone size={14} className="text-blue-500" /> : <Monitor size={14} className="text-purple-500" />}
                      </div>
                      <div>
                        <span className="block font-black text-slate-800 dark:text-zinc-200">{d.device}</span>
                        <span className="text-[8px] text-zinc-400 font-semibold">{d.count} Devices reached</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-slate-800 dark:text-zinc-200">{d.percentage}%</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* 4. NOTIFICATION RECIPIENT LOGS TABLE */}
          <Card 
            size="small"
            title={
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full pr-4 py-1">
                <span className="text-[9px] font-black uppercase text-zinc-400">Recipient Delivery Logs</span>
                {/* Logs Search */}
                <div className="relative w-full max-w-[200px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={11} />
                  <input
                    type="text"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="Search logs..."
                    className="w-full pl-7 pr-2 py-1 text-[10px] rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 focus:outline-none focus:border-[var(--primary)] font-semibold h-6"
                  />
                </div>
              </div>
            }
            className="shadow-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 overflow-hidden"
          >
            <Table 
              dataSource={logs}
              columns={logColumns}
              rowKey="_id"
              pagination={false}
              size="small"
              className="ant-table-custom"
            />
            {/* Logs Pagination */}
            <div className="flex justify-between items-center pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-900 text-[10px] font-semibold text-zinc-400">
              <span>Showing {(logPage - 1) * logLimit + 1} - {Math.min(logPage * logLimit, logsTotal)} of {logsTotal} logs</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setLogPage(prev => Math.max(1, prev - 1))}
                  disabled={logPage === 1}
                  className="py-1 px-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 bg-white dark:bg-zinc-950 text-zinc-650 cursor-pointer disabled:opacity-50 text-[9px] font-black uppercase"
                >
                  Prev
                </button>
                <span className="text-slate-800 dark:text-zinc-200 font-extrabold">{logPage}</span>
                <button
                  onClick={() => setLogPage(prev => Math.min(Math.ceil(logsTotal / logLimit), prev + 1))}
                  disabled={logPage >= Math.ceil(logsTotal / logLimit)}
                  className="py-1 px-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 bg-white dark:bg-zinc-950 text-zinc-650 cursor-pointer disabled:opacity-50 text-[9px] font-black uppercase"
                >
                  Next
                </button>
              </div>
            </div>
          </Card>

        </div>
      )}
    </Drawer>
  );
}
