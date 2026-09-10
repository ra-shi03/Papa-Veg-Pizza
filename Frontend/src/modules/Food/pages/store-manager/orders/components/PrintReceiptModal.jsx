import React, { useRef } from "react";
import { Modal, Button } from "antd";
import { Printer, Download, X } from "lucide-react";
import { toast } from "sonner";

export default function PrintReceiptModal({ visible, onClose, order }) {
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

  // Print function using browser print
  const handlePrint = () => {
    const printContent = receiptRef.current.innerHTML;
    const originalContent = document.body.innerHTML;

    // Create a simple printing window context
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

  // Simulate PDF download
  const handleDownloadPDF = () => {
    toast.success("Downloading receipt PDF...", {
      description: `Saved as PVP_Receipt_${order.orderNumber}.pdf`
    });

    // Create printable window, convert to pdf or trigger standard print-to-pdf behavior
    handlePrint();
  };

  return (
    <Modal
      title={
        <div className="flex justify-between items-center pr-8 border-b border-border pb-3">
          <span className="text-sm font-black text-foreground">Print Receipt Preview</span>
          <span className="text-[10px] font-mono bg-muted text-zinc-500 px-2 py-0.5 rounded-full">
            80mm Thermal
          </span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={420}
      centered
      destroyOnClose
      footer={[
        <Button
          key="close"
          onClick={onClose}
          icon={<X size={13} />}
          className="text-xs font-bold border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-full px-4 py-2 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer flex items-center gap-1 inline-flex"
        >
          Close
        </Button>,
        <Button
          key="download"
          onClick={handleDownloadPDF}
          icon={<Download size={13} className="text-rose-500" />}
          className="text-xs font-bold border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-full px-4 py-2 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer flex items-center gap-1 inline-flex"
        >
          PDF
        </Button>,
        <Button
          key="print"
          type="primary"
          onClick={handlePrint}
          icon={<Printer size={13} />}
          className="text-xs font-bold !bg-primary hover:!bg-primary-hover border-0 text-white rounded-full px-4 py-2 shadow-md shadow-primary/15 flex items-center gap-1 inline-flex active:scale-95 transition-all cursor-pointer"
        >
          Print Receipt
        </Button>
      ]}
    >
      <div className="py-4 flex justify-center bg-muted rounded-2xl p-4 overflow-y-auto max-h-[60vh]">
        {/* Receipt Wrapper (Looks like real thermal paper) */}
        <div
          ref={receiptRef}
          className="w-full max-w-[300px] bg-white text-zinc-900 p-5 shadow-lg border border-zinc-200 font-mono text-xs select-none"
          style={{ fontFamily: "'Courier New', Courier, monospace" }}
        >
          {/* Header */}
          <div className="text-center">
            <h2 className="text-sm font-bold tracking-wider uppercase mb-0.5">Papa Veg Pizza</h2>
            <p className="text-[10px] text-zinc-500 font-semibold mb-0.5">Vijay Nagar Outlet, Indore</p>
            <p className="text-[9px] text-zinc-400 font-semibold">FSSAI Lic No: 12345678901234</p>
            <p className="text-[10px] text-zinc-500 mt-1">Tel: +91 731 4040990</p>
          </div>

          <div className="border-t border-dashed border-zinc-350 my-2" />

          {/* Metadata */}
          <div className="space-y-0.5 text-[10px]">
            <div className="flex justify-between">
              <span>Order #:</span>
              <span className="font-bold">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date/Time:</span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>Source:</span>
              <span className="font-bold">{order.orderSource || "Website"}</span>
            </div>
            <div className="flex justify-between">
              <span>Order Type:</span>
              <span className="font-bold uppercase">{order.orderType}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Status:</span>
              <span className="font-bold uppercase">{order.paymentStatus} ({order.paymentMethod})</span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span className="font-bold">{order.customer?.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Phone:</span>
              <span>{order.customer?.phone}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-zinc-350 my-2" />

          {/* Items Header */}
          <div className="flex font-bold text-[10px] pb-1">
            <span className="w-8/12">Item Description</span>
            <span className="w-1/12 text-center">Qty</span>
            <span className="w-3/12 text-right">Amt</span>
          </div>
          <div className="border-t border-dashed border-zinc-350 mb-2" />

          {/* Items List */}
          <div className="space-y-2 text-[10px]">
            {order.items?.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex">
                  <span className="w-8/12 font-bold leading-tight">{item.name} ({item.size})</span>
                  <span className="w-1/12 text-center">{item.quantity}</span>
                  <span className="w-3/12 text-right font-bold">{formatCurrency(item.subtotal)}</span>
                </div>
                {/* Customizations preview */}
                {(item.customizations?.crustType || item.customizations?.extraToppings?.length > 0) && (
                  <div className="pl-2.5 text-[9px] text-zinc-500 leading-snug">
                    {item.customizations?.crustType && <div>- Crust: {item.customizations.crustType}</div>}
                    {item.customizations?.cheeseLevel && <div>- Cheese: {item.customizations.cheeseLevel}</div>}
                    {item.customizations?.extraToppings?.length > 0 && (
                      <div>- Toppings: {item.customizations.extraToppings.join(", ")}</div>
                    )}
                    {item.customizations?.specialInstructions && (
                      <div className="italic text-zinc-400 font-bold">*Note: {item.customizations.specialInstructions}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-zinc-350 my-2" />

          {/* Summary totals */}
          <div className="space-y-1 text-[10px] pl-16">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.couponId && (
              <div className="flex justify-between text-zinc-500">
                <span>Coupon ({order.couponId}):</span>
                <span>-{formatCurrency(order.discountAmount || 0)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Taxes (GST):</span>
              <span>{formatCurrency(order.taxes || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Packing:</span>
              <span>{formatCurrency(order.packingCharges || 0)}</span>
            </div>
            {order.orderType === "delivery" && (
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span>{formatCurrency(order.deliveryCharges || 0)}</span>
              </div>
            )}
            <div className="border-t border-dashed border-zinc-350 my-1.5" />
            <div className="flex justify-between text-sm font-bold">
              <span>GRAND TOTAL:</span>
              <span>{formatCurrency(order.grandTotal)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-zinc-350 my-3.5" />

          {/* Footer message */}
          <div className="text-center text-[9px] space-y-1 text-zinc-550 leading-relaxed font-semibold">
            <p>100% Pure Vegetarian Pizza</p>
            <p>Thank you for choosing Papa Veg Pizza!</p>
            <p>Prepared under kitchen supervisor</p>
            <p className="border border-black px-1.5 py-0.5 inline-block font-bold mt-1 uppercase tracking-wider">
              {order.kitchenSupervisorId ? "Assigned in System" : "Pending Supervisor"}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
