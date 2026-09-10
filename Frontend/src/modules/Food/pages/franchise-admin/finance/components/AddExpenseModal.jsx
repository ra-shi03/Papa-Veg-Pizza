import React, { useState } from "react";
import { Modal, Form, Select, Input, InputNumber, DatePicker, Upload, Button, ConfigProvider } from "antd";
import { InboxOutlined, DeleteOutlined, FilePdfOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Dragger } = Upload;

export default function AddExpenseModal({ isOpen, onClose, onSave, mockStores }) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);

  const categories = [
    "Inventory", "Salary", "Maintenance", "Electricity", "Gas", 
    "Marketing", "Refund", "Delivery", "Miscellaneous"
  ];

  const paymentMethods = ["Cash", "UPI", "Card", "Bank Transfer", "Wallet"];

  const handleFinish = (values) => {
    setUploading(true);
    // Simulate upload / saving process
    setTimeout(() => {
      // Find attachment URL
      let attachmentUrl = "";
      if (fileList.length > 0) {
        const file = fileList[0];
        if (file.type === "application/pdf") {
          attachmentUrl = "https://pdfobject.com/pdf/sample.pdf";
        } else {
          attachmentUrl = "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600";
        }
      }

      onSave({
        category: values.category,
        storeId: values.storeId,
        amount: values.amount,
        description: values.description,
        paymentMethod: values.paymentMethod,
        expenseDate: values.expenseDate.format("YYYY-MM-DD"),
        attachment: attachmentUrl
      });
      
      form.resetFields();
      setFileList([]);
      setUploading(false);
      onClose();
    }, 600);
  };

  const uploadProps = {
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        Modal.error({
          title: "File too large",
          content: "Invoice attachment must be smaller than 10MB."
        });
        return Upload.LIST_IGNORE;
      }
      setFileList([file]);
      return false; // prevent automatic upload
    },
    fileList,
    maxCount: 1,
    accept: ".pdf,.jpg,.png,.jpeg"
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
              Add Franchise Expense
            </h3>
            <p className="text-[10px] text-zinc-450 mt-0.5 normal-case font-normal">
              Record a new operating expenditure for audit and approval logs.
            </p>
          </div>
        }
        open={isOpen}
        onCancel={() => {
          form.resetFields();
          setFileList([]);
          onClose();
        }}
        width={750}
        centered
        footer={null}
        bodyStyle={{ maxHeight: "70vh", overflowY: "auto", padding: "20px 24px" }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            expenseDate: dayjs(),
            paymentMethod: "UPI"
          }}
          onFinish={handleFinish}
          requiredMark="optional"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            
            {/* Category */}
            <Form.Item
              name="category"
              label={<span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Expense Category</span>}
              rules={[{ required: true, message: "Please select a category" }]}
            >
              <Select placeholder="Select category" className="h-9">
                {categories.map(cat => (
                  <Select.Option key={cat} value={cat}>{cat}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* Store */}
            <Form.Item
              name="storeId"
              label={<span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Store Outlet</span>}
              rules={[{ required: true, message: "Please select a store outlet" }]}
            >
              <Select placeholder="Select store" className="h-9">
                {mockStores.map(store => (
                  <Select.Option key={store.id} value={store.id}>{store.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* Amount */}
            <Form.Item
              name="amount"
              label={<span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Amount (INR)</span>}
              rules={[
                { required: true, message: "Please enter amount" },
                { type: "number", min: 1, message: "Amount must be greater than zero" }
              ]}
            >
              <InputNumber
                className="w-full h-9 flex items-center"
                prefix={<span className="text-zinc-400 font-semibold mr-1">₹</span>}
                placeholder="Enter amount"
                parser={value => value.replace(/\$\s?|(,*)/g, "")}
              />
            </Form.Item>

            {/* Payment Method */}
            <Form.Item
              name="paymentMethod"
              label={<span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Payment Method</span>}
              rules={[{ required: true, message: "Please select payment method" }]}
            >
              <Select placeholder="Select payment method" className="h-9">
                {paymentMethods.map(method => (
                  <Select.Option key={method} value={method}>{method}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* Expense Date */}
            <Form.Item
              name="expenseDate"
              label={<span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Expense Date</span>}
              rules={[{ required: true, message: "Please select expense date" }]}
            >
              <DatePicker className="w-full h-9" format="YYYY-MM-DD" />
            </Form.Item>

            {/* Empty grid for spacing */}
            <div></div>

            {/* Description */}
            <div className="md:col-span-2">
              <Form.Item
                name="description"
                label={<span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Expense Description</span>}
                rules={[
                  { required: true, message: "Please provide a description" },
                  { max: 500, message: "Description cannot exceed 500 characters" }
                ]}
              >
                <TextArea
                  rows={3}
                  placeholder="Enter detailed description of the expense (max 500 characters)"
                  showCount
                  maxLength={500}
                />
              </Form.Item>
            </div>

            {/* Upload Invoice */}
            <div className="md:col-span-2">
              <span className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                Upload Invoice / Receipt
              </span>
              <Dragger {...uploadProps} className="p-4 border border-dashed rounded-lg bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700">
                <p className="ant-upload-drag-icon text-zinc-400">
                  <InboxOutlined className="text-2xl text-[var(--primary)]" />
                </p>
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mt-2">
                  Click or drag file to this area to upload invoice
                </p>
                <p className="text-[10px] text-zinc-450 mt-1">
                  Supports PDF, PNG, JPG files up to 10 MB limit.
                </p>
              </Dragger>
              
              {fileList.length > 0 && (
                <div className="mt-3 flex items-center justify-between p-2 border rounded-lg bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    {fileList[0].type === "application/pdf" ? (
                      <FilePdfOutlined className="text-rose-500 text-lg" />
                    ) : (
                      <div className="w-8 h-8 rounded border overflow-hidden flex items-center justify-center bg-white">
                        <img 
                          src={URL.createObjectURL(fileList[0])} 
                          alt="preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[250px]">
                      {fileList[0].name}
                    </span>
                    <span className="text-[9px] text-zinc-450">
                      ({(fileList[0].size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFileList([])}
                    className="p-1.5 text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <DeleteOutlined />
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-zinc-150 pt-4 mt-6 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => {
                form.resetFields();
                setFileList([]);
                onClose();
              }}
              className="px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 text-xs font-bold text-white bg-[var(--primary)] hover:opacity-95 rounded-lg transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              {uploading ? "Saving Expense..." : "Save Expense"}
            </button>
          </div>

        </Form>
      </Modal>
    </ConfigProvider>
  );
}
