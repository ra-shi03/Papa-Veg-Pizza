import React from "react";
import { Modal, Form, Radio, Select, Checkbox, ConfigProvider } from "antd";
import { DownloadOutlined } from "@ant-design/icons";

export default function ExportModal({ isOpen, onClose, onExport, mockStores }) {
  const [form] = Form.useForm();

  const categories = [
    "All", "Inventory", "Salary", "Maintenance", "Electricity", 
    "Gas", "Marketing", "Refund", "Delivery", "Miscellaneous"
  ];

  const statuses = ["All", "Pending", "Approved", "Rejected"];

  const handleFinish = (values) => {
    onExport(values.format, {
      category: values.category,
      storeId: values.storeId,
      status: values.status,
      includeAttachments: values.includeAttachments
    });
    onClose();
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
              Export Expense Logs
            </h3>
            <p className="text-[10px] text-zinc-450 mt-0.5 normal-case font-normal">
              Download franchise expenditures spreadsheet or PDF document with custom filters.
            </p>
          </div>
        }
        open={isOpen}
        onCancel={onClose}
        width={550}
        centered
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            format: "CSV",
            category: "All",
            storeId: "All",
            status: "All",
            includeAttachments: false
          }}
          onFinish={handleFinish}
          className="pt-4"
        >
          {/* Format Radio Group */}
          <Form.Item
            name="format"
            label={<span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">File Export Format</span>}
            rules={[{ required: true }]}
          >
            <Radio.Group className="flex gap-4">
              <Radio value="CSV">
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">CSV Spreadsheet</span>
              </Radio>
              <Radio value="Excel">
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Excel Workbook</span>
              </Radio>
              <Radio value="PDF">
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">PDF Report Document</span>
              </Radio>
            </Radio.Group>
          </Form.Item>

          {/* Category Filter */}
          <Form.Item
            name="category"
            label={<span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Category Filter</span>}
          >
            <Select placeholder="Filter by category" className="h-9">
              {categories.map(cat => (
                <Select.Option key={cat} value={cat}>{cat}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* Store Filter */}
          <Form.Item
            name="storeId"
            label={<span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Store Outlet Filter</span>}
          >
            <Select placeholder="Filter by store outlet" className="h-9">
              <Select.Option value="All">All Stores</Select.Option>
              {mockStores.map(store => (
                <Select.Option key={store.id} value={store.id}>{store.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* Status Filter */}
          <Form.Item
            name="status"
            label={<span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Approval Status Filter</span>}
          >
            <Select placeholder="Filter by approval status" className="h-9">
              {statuses.map(st => (
                <Select.Option key={st} value={st}>{st}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* Include Attachments Checkbox */}
          <Form.Item name="includeAttachments" valuePropName="checked">
            <Checkbox>
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Include receipt invoice links in exported document
              </span>
            </Checkbox>
          </Form.Item>

          {/* Actions */}
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
              className="px-4 py-2 text-xs font-bold text-white bg-[var(--primary)] hover:opacity-95 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <DownloadOutlined />
              <span>Export</span>
            </button>
          </div>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}
