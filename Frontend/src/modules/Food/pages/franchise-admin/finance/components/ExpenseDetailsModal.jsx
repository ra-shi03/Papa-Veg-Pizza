import React, { useState } from "react";
import { Modal, Tabs, Card, Timeline, Tag, Button, Tooltip, ConfigProvider } from "antd";
import { 
  FileTextOutlined, PaperClipOutlined, CalendarOutlined, 
  UserOutlined, ShopOutlined, CreditCardOutlined, 
  ZoomInOutlined, ZoomOutOutlined, RotateLeftOutlined, 
  DownloadOutlined, CheckCircleOutlined, CloseCircleOutlined,
  EditOutlined, MessageOutlined
} from "@ant-design/icons";

export default function ExpenseDetailsModal({ 
  isOpen, 
  onClose, 
  expense, 
  mockStores,
  onApprove, 
  onReject, 
  onEdit 
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [zoomScale, setZoomScale] = useState(1);

  if (!expense) return null;

  const storeName = mockStores.find(s => s.id === expense.storeId)?.name || "All Stores";

  // Formatter for currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const getStatusTag = (status) => {
    switch (status) {
      case "Approved":
        return <Tag color="success" className="font-extrabold text-[10px] uppercase">Approved</Tag>;
      case "Rejected":
        return <Tag color="error" className="font-extrabold text-[10px] uppercase">Rejected</Tag>;
      default:
        return <Tag color="warning" className="font-extrabold text-[10px] uppercase">Pending</Tag>;
    }
  };

  // Compile Remarks history
  const remarksTimelineItems = [
    {
      color: "blue",
      children: (
        <div className="text-xs">
          <p className="font-black text-zinc-800 dark:text-zinc-200">Expense Submitted</p>
          <p className="text-[10px] text-zinc-450 mt-0.5">Submitted by {expense.createdBy} on {expense.expenseDate}</p>
          <p className="text-[10.5px] italic text-zinc-500 mt-1">"{expense.description}"</p>
        </div>
      )
    }
  ];

  if (expense.status === "Approved") {
    remarksTimelineItems.push({
      color: "green",
      children: (
        <div className="text-xs">
          <p className="font-black text-emerald-600">Expense Approved</p>
          <p className="text-[10px] text-zinc-450 mt-0.5">Approved by {expense.approvedBy || "Shubham Jamliya"} on {expense.expenseDate}</p>
          <p className="text-[10.5px] italic text-zinc-500 mt-1">"System reviewed and approved for franchise reimbursement."</p>
        </div>
      )
    });
  } else if (expense.status === "Rejected") {
    remarksTimelineItems.push({
      color: "red",
      children: (
        <div className="text-xs">
          <p className="font-black text-rose-600">Expense Rejected</p>
          <p className="text-[10px] text-zinc-450 mt-0.5">Rejected by admin on {expense.expenseDate}</p>
          <p className="text-[10.5px] italic text-zinc-500 mt-1">"Rejection Note: Lacks clear vendor receipt details. Please upload correct receipt."</p>
        </div>
      )
    });
  }

  // Compile Approval Timeline History
  const approvalHistoryItems = [
    {
      color: "blue",
      children: (
        <div className="text-xs">
          <p className="font-black text-zinc-800 dark:text-zinc-200">Created & Submitted</p>
          <p className="text-[9.5px] text-zinc-450">Date: {expense.expenseDate} | User: {expense.createdBy}</p>
        </div>
      )
    }
  ];

  if (expense.status === "Approved") {
    approvalHistoryItems.push({
      color: "green",
      children: (
        <div className="text-xs">
          <p className="font-black text-emerald-600">Approved Successfully</p>
          <p className="text-[9.5px] text-zinc-450">Date: {expense.expenseDate} | Administrator: {expense.approvedBy || "Shubham Jamliya"}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Remarks: Audited and cleared.</p>
        </div>
      )
    });
  } else if (expense.status === "Rejected") {
    approvalHistoryItems.push({
      color: "red",
      children: (
        <div className="text-xs">
          <p className="font-black text-rose-600">Rejected</p>
          <p className="text-[9.5px] text-zinc-450">Date: {expense.expenseDate} | Administrator: Shubham Jamliya</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Remarks: Bill copy is blurry. Please re-upload.</p>
        </div>
      )
    });
  }

  const isPDF = expense.attachment?.endsWith(".pdf");

  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: "'Poppins', system-ui, sans-serif",
          colorPrimary: "#a43c12"
        }
      }}
    >
      <Modal
        title={
          <div className="border-b border-zinc-150 pb-3 dark:border-zinc-800 flex items-center justify-between pr-8">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black uppercase text-zinc-900 dark:text-white">
                  Expense Details: {expense.expenseNumber}
                </h3>
                {getStatusTag(expense.status)}
              </div>
              <p className="text-[10px] text-zinc-450 mt-0.5 normal-case font-normal">
                Category: {expense.category} | Outlet: {storeName}
              </p>
            </div>
          </div>
        }
        open={isOpen}
        onCancel={onClose}
        width={1100}
        centered
        footer={
          <div className="flex items-center justify-between border-t border-zinc-150 pt-4 dark:border-zinc-800">
            {/* Left buttons (Approve/Reject) */}
            <div className="flex items-center gap-2">
              {expense.status === "Pending" && (
                <>
                  <button
                    onClick={() => onApprove(expense._id)}
                    className="flex items-center gap-1.5 px-3 py-1.8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold uppercase transition-all duration-200 cursor-pointer text-[10px]"
                  >
                    <CheckCircleOutlined />
                    <span>Approve Expense</span>
                  </button>
                  <button
                    onClick={() => onReject(expense._id)}
                    className="flex items-center gap-1.5 px-3 py-1.8 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold uppercase transition-all duration-200 cursor-pointer text-[10px]"
                  >
                    <CloseCircleOutlined />
                    <span>Reject Expense</span>
                  </button>
                </>
              )}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(expense)}
                className="flex items-center gap-1.5 px-3.5 py-1.8 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold uppercase transition-all duration-200 cursor-pointer text-[10px]"
              >
                <EditOutlined />
                <span>Edit Expense</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-1.8 bg-zinc-100 hover:bg-zinc-250 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg font-bold uppercase transition-all duration-200 cursor-pointer text-[10px]"
              >
                Close
              </button>
            </div>
          </div>
        }
        bodyStyle={{ padding: "16px 24px", minHeight: "50vh" }}
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          className="compact-tabs"
          items={[
            {
              key: "overview",
              label: <span className="text-xs font-bold uppercase">Overview</span>,
              children: (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                  {/* Left Column: Metadata Cards */}
                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card size="small" className="shadow-xs border border-zinc-150">
                      <div className="flex items-center gap-2 text-zinc-450 mb-1">
                        <FileTextOutlined className="text-base text-[var(--primary)]" />
                        <span className="text-[10px] font-bold uppercase">Expense Number</span>
                      </div>
                      <p className="text-sm font-black text-zinc-800 dark:text-zinc-200">{expense.expenseNumber}</p>
                    </Card>

                    <Card size="small" className="shadow-xs border border-zinc-150">
                      <div className="flex items-center gap-2 text-zinc-450 mb-1">
                        <ShopOutlined className="text-base text-blue-500" />
                        <span className="text-[10px] font-bold uppercase">Store Outlet</span>
                      </div>
                      <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">{storeName}</p>
                    </Card>

                    <Card size="small" className="shadow-xs border border-zinc-150">
                      <div className="flex items-center gap-2 text-zinc-450 mb-1">
                        <CalendarOutlined className="text-base text-emerald-500" />
                        <span className="text-[10px] font-bold uppercase">Expense Date</span>
                      </div>
                      <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{expense.expenseDate}</p>
                    </Card>

                    <Card size="small" className="shadow-xs border border-zinc-150">
                      <div className="flex items-center gap-2 text-zinc-450 mb-1">
                        <CreditCardOutlined className="text-base text-purple-500" />
                        <span className="text-[10px] font-bold uppercase">Payment Method</span>
                      </div>
                      <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{expense.paymentMethod}</p>
                    </Card>

                    <Card size="small" className="shadow-xs border border-zinc-150 bg-zinc-50/50">
                      <div className="flex items-center gap-2 text-zinc-450 mb-1">
                        <UserOutlined className="text-base text-zinc-450" />
                        <span className="text-[10px] font-bold uppercase">Created By</span>
                      </div>
                      <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{expense.createdBy}</p>
                    </Card>

                    <Card size="small" className="shadow-xs border border-zinc-150 bg-zinc-50/50">
                      <div className="flex items-center gap-2 text-zinc-450 mb-1">
                        <UserOutlined className="text-base text-zinc-450" />
                        <span className="text-[10px] font-bold uppercase">Approved By</span>
                      </div>
                      <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                        {expense.approvedBy || <span className="text-zinc-400 italic">Not approved yet</span>}
                      </p>
                    </Card>
                  </div>

                  {/* Right Column: Amount Highlight & Description */}
                  <div className="flex flex-col gap-4">
                    <Card size="small" className="shadow-xs border border-zinc-150 bg-rose-50/20 border-rose-500/20 text-center py-3">
                      <span className="text-[10px] text-rose-500 font-black uppercase tracking-wider block mb-1">
                        Total Amount
                      </span>
                      <h2 className="text-3xl font-black text-rose-600">
                        {formatCurrency(expense.amount)}
                      </h2>
                    </Card>

                    <Card size="small" className="shadow-xs border border-zinc-150 flex-1">
                      <span className="text-[10px] text-zinc-450 font-bold uppercase block mb-1">
                        Description & Notes
                      </span>
                      <p className="text-xs leading-relaxed text-zinc-650 dark:text-zinc-300">
                        {expense.description || <span className="italic text-zinc-400">No description provided</span>}
                      </p>
                    </Card>
                  </div>
                </div>
              )
            },
            {
              key: "invoice",
              label: <span className="text-xs font-bold uppercase">Invoice Preview</span>,
              children: (
                <div className="py-4">
                  {expense.attachment ? (
                    <div className="flex flex-col items-center">
                      {/* Zoom Toolbar */}
                      <div className="flex items-center gap-4 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg mb-4 shadow-sm">
                        <Button 
                          icon={<ZoomInOutlined />} 
                          onClick={() => setZoomScale(prev => Math.min(2, prev + 0.15))}
                          type="text"
                          title="Zoom In"
                        />
                        <span className="text-[10px] font-bold">{Math.round(zoomScale * 100)}%</span>
                        <Button 
                          icon={<ZoomOutOutlined />} 
                          onClick={() => setZoomScale(prev => Math.max(0.5, prev - 0.15))}
                          type="text"
                          title="Zoom Out"
                        />
                        <Button 
                          icon={<RotateLeftOutlined />} 
                          onClick={() => setZoomScale(1)}
                          type="text"
                          title="Reset Zoom"
                        />
                        <div className="border-l h-5 border-zinc-300 mx-1"></div>
                        <Button 
                          icon={<DownloadOutlined />} 
                          href={expense.attachment}
                          target="_blank"
                          download
                          type="link"
                        >
                          Download
                        </Button>
                      </div>

                      {/* Document Viewer Frame */}
                      <div className="w-full max-h-[50vh] overflow-auto border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-950 flex items-center justify-center p-4">
                        {isPDF ? (
                          <div 
                            style={{ transform: `scale(${zoomScale})`, transformOrigin: "center center", transition: "transform 0.2s" }}
                            className="w-full max-w-xl h-[40vh] flex flex-col items-center justify-center bg-white rounded shadow p-4 text-center"
                          >
                            <FileTextOutlined className="text-5xl text-rose-500 mb-2" />
                            <p className="text-xs font-bold text-zinc-900">Commercial Invoice Document (PDF)</p>
                            <p className="text-[10px] text-zinc-400 mt-1">Ready for download or raw viewing</p>
                            <a 
                              href={expense.attachment}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-4 px-4 py-2 bg-[var(--primary)] text-white text-xs font-bold uppercase rounded-lg hover:opacity-95"
                            >
                              Open in New Tab
                            </a>
                          </div>
                        ) : (
                          <img 
                            src={expense.attachment} 
                            alt="invoice receipt" 
                            style={{ transform: `scale(${zoomScale})`, transformOrigin: "center center", transition: "transform 0.2s" }}
                            className="max-h-[40vh] object-contain rounded"
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-zinc-50 dark:bg-zinc-900 border rounded-xl border-dashed">
                      <PaperClipOutlined className="text-3xl text-zinc-300 mb-2" />
                      <p className="text-xs text-zinc-450">No invoice or receipt attachment uploaded for this expense.</p>
                    </div>
                  )}
                </div>
              )
            },
            {
              key: "history",
              label: <span className="text-xs font-bold uppercase">Approval History</span>,
              children: (
                <div className="py-6 max-w-xl mx-auto">
                  <Timeline items={approvalHistoryItems} />
                </div>
              )
            },
            {
              key: "attachments",
              label: <span className="text-xs font-bold uppercase">Attachments ({expense.attachment ? 1 : 0})</span>,
              children: (
                <div className="py-4">
                  {expense.attachment ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <Card 
                        size="small" 
                        className="shadow-xs border border-zinc-150 overflow-hidden"
                        cover={
                          <div className="h-28 bg-zinc-100 flex items-center justify-center border-b">
                            {isPDF ? (
                              <FileTextOutlined className="text-4xl text-rose-500" />
                            ) : (
                              <img src={expense.attachment} alt="receipt" className="w-full h-full object-cover" />
                            )}
                          </div>
                        }
                        actions={[
                          <a href={expense.attachment} target="_blank" rel="noreferrer" className="text-[10px] font-bold uppercase">Open</a>,
                          <a href={expense.attachment} download className="text-[10px] font-bold uppercase text-[var(--primary)]">Download</a>
                        ]}
                      >
                        <Card.Meta 
                          title={<span className="text-xs font-bold">Expense Invoice Receipt</span>} 
                          description={<span className="text-[9px]">{isPDF ? "PDF Document" : "WebP/JPG Image"}</span>}
                        />
                      </Card>
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-zinc-50 dark:bg-zinc-900 border rounded-xl border-dashed">
                      <PaperClipOutlined className="text-3xl text-zinc-300 mb-2" />
                      <p className="text-xs text-zinc-450">No attachments found.</p>
                    </div>
                  )}
                </div>
              )
            },
            {
              key: "remarks",
              label: <span className="text-xs font-bold uppercase">Remarks & Notes</span>,
              children: (
                <div className="py-6 max-w-xl mx-auto">
                  <Timeline items={remarksTimelineItems} />
                </div>
              )
            }
          ]}
        />
      </Modal>
    </ConfigProvider>
  );
}
