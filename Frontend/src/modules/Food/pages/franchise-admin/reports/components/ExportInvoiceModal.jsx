import React from "react";
import { X, FileText, FileSpreadsheet, Printer, Download, RefreshCw } from "lucide-react";
import { useOrderInvoice } from "../hooks/useOrdersReport";
import { toast } from "sonner";

export default function ExportInvoiceModal({ isOpen, orderId, onClose }) {
  const { data: invoice, isLoading, error } = useOrderInvoice(orderId);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (!invoice) return;
    toast.success("Opening print dialog...");
    // Simulating Print View
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${invoice.orderNumber}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-between: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .details { margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #eee; padding: 10px; text-align: left; }
            th { bg-color: #f9f9f9; }
            .totals { text-align: right; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h2>PAPA VEG PIZZA</h2>
              <p>Indore Outlet, Madhya Pradesh, India</p>
            </div>
            <div style="text-align: right;">
              <h2>INVOICE</h2>
              <p>Invoice No: ${invoice.orderNumber}</p>
              <p>Date: ${new Date(invoice.timeline?.[0]?.timestamp).toLocaleDateString()}</p>
            </div>
          </div>
          <div class="details">
            <h3>Billed To:</h3>
            <p><strong>${invoice.customer?.name}</strong></p>
            <p>${invoice.customer?.email}</p>
            <p>${invoice.customer?.phone}</p>
            <p>${invoice.customer?.address}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items?.map(item => `
                <tr>
                  <td>${item.name} ${item.customization ? `<br/><small>Customization: ${item.customization}</small>` : ""}</td>
                  <td>₹${item.price}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.subtotal}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <div class="totals">
            <p>Subtotal: ₹${invoice.invoiceSummary?.subtotal}</p>
            <p>Tax (GST): ₹${invoice.invoiceSummary?.tax}</p>
            <p>Discount: -₹${invoice.invoiceSummary?.discount}</p>
            <p>Delivery Charges: ₹${invoice.invoiceSummary?.deliveryCharges}</p>
            <h3>Grand Total: ₹${invoice.invoiceSummary?.grandTotal}</h3>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
    onClose();
  };

  const handleDownload = (format) => {
    if (!invoice) return;
    toast.success(`Downloading invoice as ${format}...`);

    let content = "";
    let filename = `invoice-${invoice.orderNumber}`;

    if (format === "PDF" || format === "CSV") {
      content = `
Papa Veg Pizza Invoice
Order Number: ${invoice.orderNumber}
Customer: ${invoice.customer?.name}
Phone: ${invoice.customer?.phone}
Email: ${invoice.customer?.email}
Address: ${invoice.customer?.address}

ITEMS ORDERED:
${invoice.items?.map(item => `- ${item.name} (Qty: ${item.quantity}) - ₹${item.subtotal}`).join("\n")}

SUMMARY:
Subtotal: ₹${invoice.invoiceSummary?.subtotal}
Tax: ₹${invoice.invoiceSummary?.tax}
Discount: -₹${invoice.invoiceSummary?.discount}
Delivery Charges: ₹${invoice.invoiceSummary?.deliveryCharges}
Grand Total: ₹${invoice.invoiceSummary?.grandTotal}
`;
      filename += format === "PDF" ? ".txt" : ".csv"; // download as txt file for mock PDF
    } else {
      content = `Order Number,Item Name,Price,Quantity,Subtotal\n` +
        invoice.items?.map(item => `"${invoice.orderNumber}","${item.name}",${item.price},${item.quantity},${item.subtotal}`).join("\n") +
        `\n\nSubtotal,,,,,₹${invoice.invoiceSummary?.subtotal}\n` +
        `Tax,,,,,₹${invoice.invoiceSummary?.tax}\n` +
        `Discount,,,,,-₹${invoice.invoiceSummary?.discount}\n` +
        `Delivery Charges,,,,,₹${invoice.invoiceSummary?.deliveryCharges}\n` +
        `Grand Total,,,,,₹${invoice.invoiceSummary?.grandTotal}`;
      filename += ".csv";
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onClose();
  };

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 overflow-hidden text-xs select-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs z-50 animate-fade-in" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up font-semibold text-zinc-750 dark:text-zinc-350">
          
          {/* Header */}
          <header className="p-3.5 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
              Export Invoice
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 cursor-pointer">
              <X size={14} />
            </button>
          </header>

          {isLoading ? (
            <div className="p-8 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="animate-spin text-[var(--primary)]" size={24} />
              <p className="text-[10px] text-zinc-400 font-bold">Loading invoice data...</p>
            </div>
          ) : error || !invoice ? (
            <div className="p-6 text-center text-red-500 font-bold">
              Failed to load invoice.
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-150 dark:border-zinc-850 space-y-1">
                <span className="text-[10px] text-zinc-400 block">Target Invoice</span>
                <span className="text-zinc-800 dark:text-zinc-200 font-bold block">{invoice.orderNumber}</span>
                <span className="text-[9px] text-zinc-400 block">Customer: {invoice.customer?.name} • Amount: ₹{invoice.invoiceSummary?.grandTotal}</span>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handleDownload("PDF")}
                  className="w-full p-3 border border-zinc-200 dark:border-zinc-850 hover:border-[var(--primary)]/30 bg-zinc-50/10 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 rounded-xl transition-all duration-200 flex items-center justify-between text-zinc-800 dark:text-zinc-200 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-red-500/10 text-red-500 rounded-lg">
                      <FileText size={14} />
                    </span>
                    <span className="font-bold">Export PDF Document</span>
                  </div>
                  <Download size={14} className="text-zinc-400" />
                </button>

                <button
                  onClick={() => handleDownload("Excel")}
                  className="w-full p-3 border border-zinc-200 dark:border-zinc-850 hover:border-[var(--primary)]/30 bg-zinc-50/10 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 rounded-xl transition-all duration-200 flex items-center justify-between text-zinc-800 dark:text-zinc-200 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
                      <FileSpreadsheet size={14} />
                    </span>
                    <span className="font-bold">Export Excel Spreadsheet</span>
                  </div>
                  <Download size={14} className="text-zinc-400" />
                </button>

                <button
                  onClick={handlePrint}
                  className="w-full p-3 border border-zinc-200 dark:border-zinc-850 hover:border-[var(--primary)]/30 bg-zinc-50/10 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 rounded-xl transition-all duration-200 flex items-center justify-between text-zinc-800 dark:text-zinc-200 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg">
                      <Printer size={14} />
                    </span>
                    <span className="font-bold">Print Invoice Receipt</span>
                  </div>
                  <Printer size={14} className="text-zinc-400" />
                </button>
              </div>

              <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-zinc-900">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg font-bold cursor-pointer text-zinc-800 dark:text-zinc-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
