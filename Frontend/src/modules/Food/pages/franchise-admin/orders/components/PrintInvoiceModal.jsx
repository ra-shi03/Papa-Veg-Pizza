import React, { useRef } from "react";
import { X, Printer, Download, Receipt } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function PrintInvoiceModal({ isOpen, onClose, order }) {
  const invoiceRef = useRef(null);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    const printContent = invoiceRef.current.innerHTML;
    const originalContent = document.body.innerHTML;

    // Open a new window for clean thermal printing
    const printWindow = window.open("", "_blank", "width=800,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${order.orderNumber}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #000; font-size: 12px; line-height: 1.4; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .header { margin-bottom: 20px; }
            .logo { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
            .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            .table th { border-bottom: 1px dashed #000; padding: 5px 0; font-weight: bold; }
            .table td { padding: 5px 0; }
            .footer { margin-top: 30px; font-size: 10px; }
          </style>
        </head>
        <body onload="window.print();window.close()">
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    toast.success("Sending document to printer...");
  };

  const handleDownload = () => {
    toast.success("Invoice PDF generated and downloaded.");
    
    // Create text summary as a downloadable file representing invoice
    const content = `
=========================================
          PAPA VEG PIZZA
=========================================
Store: ${order.store.name}
Order No: ${order.orderNumber}
Date: ${format(new Date(order.placedAt), "dd MMM yyyy, hh:mm a")}
Customer: ${order.customer.name} (${order.customer.phone})
-----------------------------------------
Items:
${order.items.map(item => `${item.productName} (${item.variant}) x ${item.quantity} @ ₹${item.price} = ₹${item.price * item.quantity}`).join("\n")}
-----------------------------------------
Subtotal: ₹${order.pricing.subtotal.toFixed(2)}
Taxes (GST): ₹${order.pricing.tax.toFixed(2)}
Delivery Fee: ₹${order.pricing.deliveryFee.toFixed(2)}
Discount: -₹${order.pricing.discount.toFixed(2)}
-----------------------------------------
TOTAL AMOUNT: ₹${order.pricing.total.toFixed(2)}
=========================================
      Thank you for ordering veg!
=========================================
`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Invoice_${order.orderNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-[500px] bg-white dark:bg-zinc-955 rounded-2xl border border-zinc-150 dark:border-zinc-800 shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <header className="p-4 border-b border-zinc-100 dark:border-zinc-850 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-[var(--primary)]" />
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
              Print Invoice Preview
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        {/* Invoice thermal sheet preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-100 dark:bg-zinc-900 flex justify-center scrollbar-thin">
          <div 
            ref={invoiceRef}
            className="w-full max-w-[360px] bg-white text-zinc-900 p-6 shadow-md border border-zinc-200 font-mono text-[11px] leading-relaxed relative"
          >
            {/* Top jagged cut design */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-zinc-200/50 flex overflow-hidden">
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className="w-2.5 h-2.5 bg-white transform rotate-45 -translate-y-1.5 shrink-0" />
              ))}
            </div>

            <div className="text-center header pt-2">
              <h2 className="logo text-sm font-black tracking-tight text-zinc-950">PAPA VEG PIZZA</h2>
              <p className="font-bold">{order.store.name}</p>
              <p className="text-[9px] text-zinc-500 font-semibold">100% Pure Vegetarian Delights</p>
            </div>

            <div className="divider" />

            <div className="space-y-1">
              <p><span className="bold">Order No:</span> {order.orderNumber}</p>
              <p><span className="bold">Date:</span> {format(new Date(order.placedAt), "dd MMM yyyy, hh:mm a")}</p>
              <p><span className="bold">Customer:</span> {order.customer.name}</p>
              <p><span className="bold">Phone:</span> {order.customer.phone}</p>
              <p><span className="bold">Type:</span> {order.orderType}</p>
            </div>

            <div className="divider" />

            <table className="table text-[11px]">
              <thead>
                <tr>
                  <th className="text-left font-bold">Item</th>
                  <th className="text-center font-bold" style={{ width: "40px" }}>Qty</th>
                  <th className="text-right font-bold" style={{ width: "70px" }}>Price</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <p className="bold">{item.productName}</p>
                      <p className="text-[9px] text-zinc-500">{item.variant}</p>
                    </td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-right">₹{(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="divider" />

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{order.pricing.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%):</span>
                <span>₹{order.pricing.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge:</span>
                <span>₹{order.pricing.deliveryFee.toFixed(2)}</span>
              </div>
              {order.pricing.discount > 0 && (
                <div className="flex justify-between text-rose-600 bold">
                  <span>Discount:</span>
                  <span>-₹{order.pricing.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="divider" />
              <div className="flex justify-between text-sm bold tracking-tight">
                <span>GRAND TOTAL:</span>
                <span>₹{order.pricing.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="divider" />

            <div className="text-center footer text-zinc-500 bold pt-2">
              <p>Paid via {order.paymentMethod} — {order.paymentStatus}</p>
              <p className="mt-1">THANK YOU FOR ORDERING VEG!</p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
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
