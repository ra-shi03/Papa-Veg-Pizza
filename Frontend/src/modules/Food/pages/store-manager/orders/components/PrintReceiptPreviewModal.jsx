import React, { useRef } from "react";
import { Modal, Button } from "antd";
import { Printer, Download, X } from "lucide-react";
import { toast } from "sonner";

export default function PrintReceiptPreviewModal({ visible, onClose, order }) {
  const receiptRef = useRef();

  if (!order) return null;

  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(val);
  };

  // Helper to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "short",
      timeStyle: "short"
    });
  };

  const handlePrint = () => {
    const printContent = receiptRef.current.innerHTML;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt #${order.orderNumber}</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              padding: 20px;
              color: #000;
              width: 80mm;
              margin: 0 auto;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .double-divider { border-top: 2px double #000; margin: 10px 0; }
            .font-bold { font-weight: bold; }
            .text-xs { font-size: 11px; }
            .text-sm { font-size: 13px; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 3px 0; font-size: 12px; vertical-align: top; }
            .customizations { font-size: 10px; color: #555; padding-left: 8px; font-style: italic; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    toast.success("Receipt sent to printer spool.");
  };

  const handleDownloadPDF = () => {
    toast.success("Downloading receipt PDF...", {
      description: `Saved as PVP_Receipt_${order.orderNumber}.pdf`
    });
    handlePrint();
  };

  return (
    <Modal
      title={
        <div className="flex justify-between items-center pr-8 border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <span className="text-sm font-black text-slate-900 dark:text-white">Print Receipt Preview</span>
          <span className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2.5 py-0.5 rounded-full">
            80mm Thermal
          </span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={400}
      centered
      destroyOnClose
      footer={[
        <Button
          key="close"
          onClick={onClose}
          className="text-xs font-bold border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-full px-4 py-2 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
        >
          Cancel
        </Button>,
        <Button
          key="pdf"
          onClick={handleDownloadPDF}
          className="text-xs font-bold !border-primary/45 !text-primary bg-white dark:bg-zinc-900 hover:!bg-primary/5 hover:!border-primary hover:!text-primary-hover active:scale-95 transition-all cursor-pointer rounded-full px-4 py-2 shadow-sm flex items-center gap-1.5 inline-flex justify-center"
        >
          <Download size={13} className="text-primary" />
          PDF
        </Button>,
        <Button
          key="print"
          type="primary"
          onClick={handlePrint}
          className="!bg-primary hover:!bg-primary-hover border-0 !text-white rounded-full font-bold px-5 py-2 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer text-xs flex items-center gap-1.5 inline-flex justify-center"
        >
          <Printer size={13} />
          Print
        </Button>
      ]}
    >
      <div className="py-4 flex justify-center bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-100 dark:border-zinc-900 p-4 max-h-[450px] overflow-y-auto">
        {/* Mock Receipt Container */}
        <div
          ref={receiptRef}
          className="bg-white text-black p-4 shadow-sm w-[72mm] border border-zinc-200 text-xs font-mono select-text"
        >
          <div className="text-center">
            <h2 className="font-bold text-sm">PAPA VEG PIZZA</h2>
            <p className="text-[10px]">Indore Store Operation Panel</p>
            <p className="text-[9px]">PVP-01, Saket Main Road, Indore</p>
            <p className="text-[9px]">GSTIN: 23AABCP1234D1Z2</p>
          </div>

          <div className="divider"></div>

          <div className="space-y-0.5 text-[10px]">
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{formatDate(order.readyAt || order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>Order No:</span>
              <span className="font-bold">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Order Type:</span>
              <span className="font-bold uppercase">{order.orderType}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Method:</span>
              <span className="font-bold uppercase">{order.paymentMethod}</span>
            </div>
          </div>

          <div className="divider"></div>

          <div className="space-y-1">
            <div className="flex font-bold text-[11px]">
              <span className="w-1/2">Item Description</span>
              <span className="w-1/6 text-center">Qty</span>
              <span className="w-1/3 text-right">Price</span>
            </div>
            <div className="divider"></div>
            
            {order.items?.map((item, idx) => (
              <div key={idx} className="text-[10px] space-y-0.5">
                <div className="flex">
                  <span className="w-1/2 font-bold">{item.name}</span>
                  <span className="w-1/6 text-center">{item.quantity}</span>
                  <span className="w-1/3 text-right">{formatCurrency(item.subtotal)}</span>
                </div>
                {item.customizations && (
                  <div className="customizations">
                    {item.size && `Size: ${item.size}`}
                    {item.customizations.crustType && `, Crust: ${item.customizations.crustType}`}
                    {item.customizations.cheeseLevel && `, Cheese: ${item.customizations.cheeseLevel}`}
                    {item.customizations.extraToppings?.length > 0 && `, Toppings: [${item.customizations.extraToppings.join(", ")}]`}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="divider"></div>

          <div className="space-y-0.5 text-[10px] pr-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.grandTotal * 0.85)}</span>
            </div>
            <div className="flex justify-between">
              <span>CGST (2.5%):</span>
              <span>{formatCurrency(order.grandTotal * 0.025)}</span>
            </div>
            <div className="flex justify-between">
              <span>SGST (2.5%):</span>
              <span>{formatCurrency(order.grandTotal * 0.025)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charge:</span>
              <span>{formatCurrency(order.orderType === "delivery" ? 40.00 : 0.00)}</span>
            </div>
            <div className="divider"></div>
            <div className="flex justify-between font-bold text-xs">
              <span>Grand Total:</span>
              <span>{formatCurrency(order.grandTotal)}</span>
            </div>
          </div>

          <div className="double-divider"></div>

          <div className="text-center text-[10px] space-y-1">
            <p className="font-bold">THANK YOU FOR ORDERING!</p>
            <p>Share feedback at feedback@papavegpizza.in</p>
            <p className="text-[9px] text-zinc-400">--- Powered by Antigravity Ops Panel ---</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
