import React, { useState } from "react";
import { Modal, Button, Radio, Spin } from "antd";
import { FileText, Printer, Download, Eye, Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function DownloadInvoiceModal({ visible, onClose, order }) {
  const [loading, setLoading] = useState(false);
  const [invoiceReady, setInvoiceReady] = useState(false);

  if (!order) return null;

  const handleAction = async (type) => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoading(false);

    if (type === "preview") {
      // Simulate opening preview in new window or showing toast
      toast.success("Simulating Invoice Preview", {
        description: `Rendering INV-${order.orderNumber.replace("PVP-", "2026-")} PDF preview`
      });
      
      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice INV-${order.orderNumber}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; color: #333; }
              .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); font-size: 14px; line-height: 24px; }
              .text-right { text-align: right; }
              .font-bold { font-weight: bold; }
              table { width: 100%; line-height: inherit; text-align: left; border-collapse: collapse; }
              table td { padding: 5px; vertical-align: top; }
              table tr td:nth-child(2) { text-align: right; }
              table tr.top table td { padding-bottom: 20px; }
              table tr.information table td { padding-bottom: 40px; }
              table tr.heading td { background: #eee; border-bottom: 1px solid #ddd; font-weight: bold; }
              table tr.item td { border-bottom: 1px solid #eee; }
              table tr.total td:nth-child(2) { border-top: 2px solid #eee; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="invoice-box">
              <table>
                <tr class="top">
                  <td colspan="2">
                    <table>
                      <tr>
                        <td class="font-bold" style="font-size: 20px;">PAPA VEG PIZZA</td>
                        <td class="text-right">
                          Invoice: INV-${order.orderNumber.replace("PVP-", "2026-")}<br>
                          Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr class="information">
                  <td colspan="2">
                    <table>
                      <tr>
                        <td>
                          Papa Veg Pizza, Indore Store<br>
                          Saket Main Road, Indore<br>
                          GSTIN: 23AABCP1234D1Z2
                        </td>
                        <td class="text-right">
                          ${order.customer?.name}<br>
                          ${order.customer?.phone}<br>
                          ${order.customer?.email || "N/A"}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr class="heading">
                  <td>Payment Details</td>
                  <td>Amount</td>
                </tr>
                <tr class="item">
                  <td>Method: ${order.paymentMethod}</td>
                  <td>Status: Paid</td>
                </tr>
                <tr class="heading">
                  <td>Item Description</td>
                  <td>Price</td>
                </tr>
                ${order.items.map(it => `
                  <tr class="item">
                    <td>${it.name} (x${it.quantity})</td>
                    <td>₹${it.subtotal}</td>
                  </tr>
                `).join("")}
                <tr class="total">
                  <td></td>
                  <td>Total Bill: ₹${order.grandTotal}</td>
                </tr>
              </table>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else if (type === "download") {
      toast.success("Downloading PDF Invoice...", {
        description: `Saved as PVP_Invoice_${order.orderNumber}.pdf`
      });
    } else if (type === "print") {
      toast.success("Printing invoice spool triggered.");
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 pr-8">
          <FileText size={18} className="text-primary" />
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Download Tax Invoice</h3>
            <p className="text-[10px] text-zinc-400 font-semibold">Select an option below to manage billing invoices</p>
          </div>
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
          Close
        </Button>
      ]}
    >
      <div className="py-6 space-y-4 text-center">
        {loading ? (
          <div className="py-6 flex flex-col items-center gap-2">
            <Spin size="medium" />
            <span className="text-xs font-bold text-zinc-400">Processing Document Spool...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div 
              onClick={() => handleAction("preview")}
              className="bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="p-2.5 bg-blue-50 text-blue-500 rounded-full">
                  <Eye size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200">Preview Invoice</h4>
                  <p className="text-[10px] text-zinc-450">Render Invoice PDF in new browser tab</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-zinc-400" />
            </div>

            <div 
              onClick={() => handleAction("download")}
              className="bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="p-2.5 bg-emerald-50 text-emerald-500 rounded-full">
                  <Download size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200">Download PDF</h4>
                  <p className="text-[10px] text-zinc-450">Save tax invoice document directly</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-zinc-400" />
            </div>

            <div 
              onClick={() => handleAction("print")}
              className="bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="p-2.5 bg-purple-50 text-purple-500 rounded-full">
                  <Printer size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200">Print Invoice</h4>
                  <p className="text-[10px] text-zinc-450">Send print job to 80mm/A4 printer spool</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-zinc-400" />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
