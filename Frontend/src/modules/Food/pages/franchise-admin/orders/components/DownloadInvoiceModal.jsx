import React, { useRef } from "react";
import { X, Printer, Download, Receipt, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function DownloadInvoiceModal({ isOpen, onClose, order }) {
  const invoiceRef = useRef(null);

  if (!isOpen || !order) return null;

  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    try {
      return format(new Date(timeStr), "dd MMM yyyy, hh:mm a");
    } catch {
      return timeStr;
    }
  };

  const handlePrint = () => {
    const printContent = invoiceRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${order.orderNumber}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.5; }
            .header-table { width: 100%; border-bottom: 2px solid #a43c12; padding-bottom: 20px; margin-bottom: 20px; }
            .company-name { font-size: 24px; font-weight: bold; color: #a43c12; }
            .details-table { width: 100%; margin-bottom: 30px; }
            .details-table td { vertical-align: top; padding: 5px; font-size: 13px; }
            .item-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .item-table th { background: #f8f8f8; padding: 10px; text-align: left; font-weight: bold; font-size: 13px; border-bottom: 1.5px solid #ddd; }
            .item-table td { padding: 10px; font-size: 13px; border-bottom: 1px solid #eee; }
            .totals-table { width: 40%; margin-left: auto; margin-top: 20px; font-size: 13px; }
            .totals-table td { padding: 4px; }
            .bold { font-weight: bold; }
            .text-right { text-align: right; }
            .footer-note { text-align: center; font-size: 11px; color: #777; margin-top: 50px; border-top: 1px solid #eee; padding-top: 15px; }
          </style>
        </head>
        <body onload="window.print();window.close()">
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    toast.success("Sending document to printer queue...");
  };

  const handleDownload = () => {
    toast.success("Invoice PDF generated and downloaded.");
    
    const content = `
========================================================================
                      PAPA VEG PIZZA TAX INVOICE
========================================================================
Invoice Number: INV-${order.orderNumber.split("-")[1]}
Order Number  : ${order.orderNumber}
Date/Time     : ${formatTime(order.placedAt)}
Store Location: ${order.store.name}
------------------------------------------------------------------------
Billed To:
Name          : ${order.customer.name}
Phone         : ${order.customer.phone}
Email         : ${order.customer.email}
Address       : ${order.customer.address}
------------------------------------------------------------------------
Items Summary:
${order.items.map(item => `- ${item.productName} (${item.variant}) x ${item.quantity} @ ₹${item.price.toFixed(2)} = ₹${(item.price * item.quantity).toFixed(2)}`).join("\n")}
------------------------------------------------------------------------
Subtotal: ₹${order.pricing.subtotal.toFixed(2)}
GST Taxes (5%): ₹${order.pricing.tax.toFixed(2)}
Delivery Charge: ₹${order.pricing.deliveryFee.toFixed(2)}
Coupon Discount Applied (${order.couponApplied || "None"}): -₹${order.pricing.discount.toFixed(2)}
------------------------------------------------------------------------
GRAND TOTAL   : ₹${order.pricing.total.toFixed(2)}
Payment Status: ${order.paymentStatus} (Via ${order.paymentMethod})
========================================================================
               Thank you for supporting Papa Veg Pizza!
========================================================================
`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Invoice_Completed_${order.orderNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-[800px] h-[90vh] bg-white dark:bg-zinc-955 rounded-2xl border border-zinc-150 dark:border-zinc-800 shadow-2xl overflow-hidden animate-scale-up flex flex-col">
        
        {/* Header */}
        <header className="p-4 border-b border-zinc-100 dark:border-zinc-850 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-[var(--primary)]" />
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
              Tax Invoice Preview — {order.orderNumber}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-650 transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        {/* Invoice Body Canvas (Mock A4 sheet) */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-100 dark:bg-zinc-900 flex justify-center scrollbar-thin">
          <div 
            ref={invoiceRef}
            className="w-full max-w-[700px] bg-white text-zinc-900 p-8 shadow-lg border border-zinc-200 font-sans text-xs leading-relaxed"
          >
            {/* Header table */}
            <div className="header-table flex justify-between items-start border-b-2 border-[var(--primary)] pb-4 mb-4">
              <div>
                <h1 className="text-lg font-black text-[var(--primary)] tracking-tight">PAPA VEG PIZZA</h1>
                <p className="text-[10px] text-zinc-500 font-bold mt-0.5">Corporate Tax ID: GSTIN-07AAAAA1111A1Z1</p>
                <p className="text-[10px] text-zinc-500 font-medium">{order.store.name}</p>
              </div>
              <div className="text-right">
                <h2 className="text-sm font-black text-zinc-850 uppercase tracking-wide">Tax Invoice</h2>
                <p className="font-bold text-zinc-700">INV-{order.orderNumber.split("-")[1]}</p>
                <p className="text-[10px] text-zinc-400 font-semibold">{formatTime(order.placedAt)}</p>
              </div>
            </div>

            {/* Billing addresses details */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="font-bold text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Store Details</p>
                <p className="font-bold text-zinc-800">Papa Veg Pizza Store</p>
                <p className="text-zinc-500 font-medium">Franchise Branch Node #{order.store.storeId}</p>
                <p className="text-zinc-500 font-medium">Billed by Branch Kitchen Desk</p>
              </div>
              <div>
                <p className="font-bold text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Billed To</p>
                <p className="font-bold text-zinc-800">{order.customer.name}</p>
                <p className="text-zinc-500 font-medium">{order.customer.phone} | {order.customer.email}</p>
                <p className="text-zinc-500 font-medium">{order.customer.address}</p>
              </div>
            </div>

            {/* Line items table */}
            <table className="w-full text-left border-collapse item-table">
              <thead>
                <tr className="bg-zinc-50 text-zinc-550 border-b border-zinc-200">
                  <th className="p-2 font-bold text-left">Description</th>
                  <th className="p-2 font-bold text-center" style={{ width: "60px" }}>Qty</th>
                  <th className="p-2 font-bold text-right" style={{ width: "90px" }}>Price</th>
                  <th className="p-2 font-bold text-right" style={{ width: "100px" }}>Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-2">
                      <p className="font-bold text-zinc-800">{item.productName}</p>
                      <p className="text-[10px] text-zinc-400">{item.variant}</p>
                    </td>
                    <td className="p-2 text-center font-bold">{item.quantity}</td>
                    <td className="p-2 text-right">₹{item.price.toFixed(2)}</td>
                    <td className="p-2 text-right font-bold">₹{(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals column */}
            <div className="flex justify-end mt-4">
              <table className="w-[280px] text-xs leading-normal font-semibold">
                <tbody>
                  <tr>
                    <td className="text-zinc-400 py-1">Subtotal:</td>
                    <td className="text-right py-1">₹{order.pricing.subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="text-zinc-400 py-1">GST (5%):</td>
                    <td className="text-right py-1">₹{order.pricing.tax.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="text-zinc-400 py-1">Delivery Charge:</td>
                    <td className="text-right py-1">₹{order.pricing.deliveryFee.toFixed(2)}</td>
                  </tr>
                  {order.pricing.discount > 0 && (
                    <tr className="text-rose-650 font-bold">
                      <td className="py-1">Coupon Discount ({order.couponApplied}):</td>
                      <td className="text-right py-1">-₹{order.pricing.discount.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr className="border-t border-zinc-200 font-black">
                    <td className="py-2 text-sm text-[var(--primary)]">Total Paid:</td>
                    <td className="text-right py-2 text-sm text-[var(--primary)]">₹{order.pricing.total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer terms */}
            <div className="footer-note text-center text-zinc-450 border-t border-zinc-100 pt-4 mt-6">
              <p>This is a computer-generated tax invoice. No signature is required.</p>
              <p className="mt-1 font-bold">Thank you for ordering with Papa Veg Pizza!</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <footer className="p-4 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="px-4 py-2 border border-zinc-205 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 rounded-xl text-xs font-bold shadow-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
            >
              <Download size={13} />
              Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl text-xs font-bold shadow-md shadow-[var(--primary)]/15 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Printer size={13} />
              Print Invoice
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
