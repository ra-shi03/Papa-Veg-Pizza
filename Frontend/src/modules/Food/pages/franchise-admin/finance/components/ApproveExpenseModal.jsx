import React, { useState } from "react";
import { Modal, Form, Radio, Input, Card, Button, ConfigProvider } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";

const { TextArea } = Input;

export default function ApproveExpenseModal({ isOpen, onClose, expense, mockStores, onSubmitDecision }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  if (!expense) return null;

  const storeName = mockStores.find(s => s.id === expense.storeId)?.name || "All Stores";

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleFinish = (values) => {
    setSubmitting(true);
    setTimeout(() => {
      onSubmitDecision(expense._id, values.status, values.remarks);
      form.resetFields();
      setSubmitting(false);
      onClose();
    }, 500);
  };

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
          <div className="border-b border-zinc-150 pb-3 dark:border-zinc-800">
            <h3 className="text-base font-black uppercase text-zinc-900 dark:text-white">
              Approve / Reject Expense
            </h3>
            <p className="text-[10px] text-zinc-450 mt-0.5 normal-case font-normal">
              Review and audit the franchise expenditure request below.
            </p>
          </div>
        }
        open={isOpen}
        onCancel={onClose}
        width={600}
        centered
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: "Approved",
            remarks: ""
          }}
          onFinish={handleFinish}
          className="pt-4"
        >
          {/* Expense Summary Card */}
          <Card 
            size="small" 
            className="mb-4 border border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 rounded-xl"
            bodyStyle={{ padding: "16px" }}
          >
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
              <div>
                <span className="text-zinc-450 uppercase text-[9px] font-black block">Expense No</span>
                <span className="font-extrabold text-zinc-850 dark:text-zinc-150">{expense.expenseNumber}</span>
              </div>
              <div>
                <span className="text-zinc-450 uppercase text-[9px] font-black block">Category</span>
                <span className="font-bold text-zinc-850 dark:text-zinc-150">{expense.category}</span>
              </div>
              <div>
                <span className="text-zinc-450 uppercase text-[9px] font-black block">Outlet</span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate block max-w-[200px]">{storeName}</span>
              </div>
              <div>
                <span className="text-zinc-450 uppercase text-[9px] font-black block">Expense Date</span>
                <span className="font-medium text-zinc-750 dark:text-zinc-250">{expense.expenseDate}</span>
              </div>
              <div className="col-span-2 border-t pt-2 mt-1">
                <span className="text-zinc-450 uppercase text-[9px] font-black block">Amount Requested</span>
                <span className="text-xl font-black text-rose-600">{formatCurrency(expense.amount)}</span>
              </div>
            </div>
          </Card>

          {/* Decision */}
          <Form.Item
            name="status"
            label={<span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Approval Decision</span>}
            rules={[{ required: true, message: "Please select a status decision" }]}
          >
            <Radio.Group className="flex gap-4">
              <Radio value="Approved">
                <span className="text-xs font-black text-emerald-600 uppercase">Approve</span>
              </Radio>
              <Radio value="Rejected">
                <span className="text-xs font-black text-rose-600 uppercase">Reject</span>
              </Radio>
            </Radio.Group>
          </Form.Item>

          {/* Remarks */}
          <Form.Item
            name="remarks"
            label={<span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Approval / Rejection Remarks</span>}
            rules={[
              { required: true, message: "Please provide decision remarks or comments" },
              { max: 300, message: "Remarks cannot exceed 300 characters" }
            ]}
          >
            <TextArea
              rows={3}
              placeholder="Provide comments or reason for this audit decision (max 300 characters)"
              showCount
              maxLength={300}
            />
          </Form.Item>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-zinc-150 pt-4 mt-6 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-white bg-[var(--primary)] hover:opacity-95 rounded-lg transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              {submitting ? "Submitting Decision..." : "Submit Decision"}
            </button>
          </div>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}
