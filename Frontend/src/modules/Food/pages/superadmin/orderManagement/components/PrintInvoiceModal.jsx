// PrintInvoiceModal.jsx
import React from 'react';
import { X, Printer, Download } from 'lucide-react';

export default function PrintInvoiceModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsRows = order.items?.map(item => `
      <tr>
        <td><strong>${item.productName}</strong><br/><span style="color: #6b7280; font-size: 11px;">${item.variant || 'Standard'}</span></td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">₹${item.unitPrice.toFixed(2)}</td>
        <td style="text-align: right;">₹${item.subtotal.toFixed(2)}</td>
      </tr>
    `).join('') || '';

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - Order ${order.orderNumber}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #111827; max-width: 600px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px; }
            .header h1 { margin: 0 0 5px 0; color: #af101a; font-size: 24px; text-transform: uppercase; letter-spacing: 0.5px; }
            .header p { margin: 0; color: #6b7280; font-size: 12px; }
            .details { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 13px; line-height: 1.5; }
            .details-box { flex: 1; }
            .details-box h3 { font-size: 11px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; margin: 0 0 8px 0; border-bottom: 1px solid #f3f4f6; padding-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
            th, td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: left; }
            th { background-color: #f9fafb; font-weight: 600; text-transform: uppercase; font-size: 10px; color: #6b7280; letter-spacing: 0.05em; }
            .summary { width: 260px; margin-left: auto; background: #f9fafb; padding: 15px; border-radius: 8px; font-size: 13px; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 6px; color: #4b5563; }
            .summary-row.total { font-weight: bold; font-size: 15px; border-top: 1px solid #d1d5db; padding-top: 10px; margin-top: 10px; color: #111827; }
            .footer { text-align: center; margin-top: 40px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; line-height: 1.4; }
            @media print {
              body { padding: 0; max-width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Papa Veg Pizza</h1>
            <p>Tax Invoice / Bill of Supply</p>
            <p style="margin-top: 5px;"><strong>FSSAI License:</strong> 12345678901234 | <strong>GSTIN:</strong> 29XXXXX1234X1ZX</p>
          </div>
          
          <div class="details">
            <div class="details-box">
              <h3>Order details</h3>
              <strong>Order ID:</strong> ${order.orderNumber}<br/>
              <strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()} ${new Date(order.createdAt).toLocaleTimeString()}<br/>
              <strong>Store Outlet:</strong> ${order.store?.name || 'Downtown Hub'}<br/>
              <strong>Franchise:</strong> ${order.franchise?.name || 'West India Foods'}
            </div>
            <div class="details-box" style="text-align: right;">
              <h3>Customer details</h3>
              <strong>${order.customer?.name || 'Rahul Sharma'}</strong><br/>
              ${order.customer?.phone || '+91 98765-43210'}<br/>
              ${order.customer?.address || '123 Pizza Lane, Green Valley, Bangalore'}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>₹${order.subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span>Taxes (GST 5%):</span>
              <span>₹${order.taxAmount.toFixed(2)}</span>
            </div>
            ${order.discountAmount > 0 ? `
            <div class="summary-row" style="color: #059669;">
              <span>Discount Applied (${order.couponCode || 'Promo'}):</span>
              <span>-₹${order.discountAmount.toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="summary-row" style="border-bottom: 1px dashed #d1d5db; padding-bottom: 6px; margin-bottom: 6px;">
              <span>Delivery Fee:</span>
              <span>₹${order.deliveryFee.toFixed(2)}</span>
            </div>
            <div class="summary-row total">
              <span>Grand Total:</span>
              <span>₹${order.grandTotal.toFixed(2)}</span>
            </div>
            <div style="margin-top: 12px; text-align: center; font-size: 11px; color: #059669; font-weight: bold; background: #e6f4ea; padding: 4px; border-radius: 4px; border: 1px solid #c2e7c9;">
              ${order.paymentStatus === 'Paid' ? `PAID VIA ${order.paymentMethod?.toUpperCase() || 'ONLINE'}` : order.paymentStatus?.toUpperCase() || 'PENDING'}
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for ordering from Papa Veg Pizza!</p>
            <p>This is a computer generated invoice and does not require a physical signature.</p>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 200);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Content */}
      <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-xl shadow-xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200 select-none text-zinc-800 dark:text-zinc-150 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center shrink-0 bg-zinc-50 dark:bg-zinc-900/60">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
            <Printer size={15} />
            Tax Invoice Preview
          </h3>
          <button 
            className="text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-1.5 rounded-full transition-colors cursor-pointer"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable invoice visual layout */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-100 dark:bg-zinc-950 flex justify-center">
          <div className="w-full bg-white text-zinc-900 p-6 rounded-lg shadow-sm border border-zinc-200 font-sans max-w-lg leading-normal">
            
            {/* Header branding */}
            <div className="text-center border-b-2 border-zinc-250 pb-4 mb-4">
              <h2 className="text-lg font-black text-red-700 tracking-wide uppercase">Papa Veg Pizza</h2>
              <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Tax Invoice / Bill of Supply</p>
              <p className="text-[9px] text-zinc-400 font-medium mt-1">FSSAI: 12345678901234 | GSTIN: 29XXXXX1234X1ZX</p>
            </div>

            {/* Billing metadata */}
            <div className="grid grid-cols-2 gap-4 text-[11px] mb-4 text-zinc-700 font-semibold">
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-400 block uppercase tracking-wider">Order Information</span>
                <span><strong>Order #:</strong> {order.orderNumber}</span><br />
                <span><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</span><br />
                <span><strong>Store:</strong> {order.store?.name}</span>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-[9px] text-zinc-400 block uppercase tracking-wider">Customer details</span>
                <span><strong>{order.customer?.name}</strong></span><br />
                <span>{order.customer?.phone}</span><br />
                <span className="text-zinc-450 block truncate">{order.customer?.address}</span>
              </div>
            </div>

            {/* Products Table */}
            <table className="w-full text-left text-[11px] mb-4 border-collapse">
              <thead>
                <tr className="bg-zinc-50 text-zinc-550 border-b border-zinc-200">
                  <th className="py-2 px-1 font-bold text-[9px] uppercase tracking-wider">Item Details</th>
                  <th className="py-2 px-1 font-bold text-[9px] uppercase tracking-wider text-center">Qty</th>
                  <th className="py-2 px-1 font-bold text-[9px] uppercase tracking-wider text-right">Rate</th>
                  <th className="py-2 px-1 font-bold text-[9px] uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {order.items?.map((item) => (
                  <tr key={item._id} className="text-zinc-800">
                    <td className="py-2 px-1 font-bold">{item.productName} <span className="text-[9px] font-normal text-zinc-450 block">{item.variant}</span></td>
                    <td className="py-2 px-1 text-center font-mono">{item.quantity}</td>
                    <td className="py-2 px-1 text-right font-mono">₹{item.unitPrice.toFixed(2)}</td>
                    <td className="py-2 px-1 text-right font-mono font-bold">₹{item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Billing summary block */}
            <div className="flex justify-end pt-2">
              <div className="w-56 text-[11px] space-y-1.5 font-semibold text-zinc-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono">₹{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%):</span>
                  <span className="font-mono">₹{order.taxAmount.toFixed(2)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span className="font-mono">-₹{order.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pb-1.5 border-b border-zinc-200">
                  <span>Delivery Fee:</span>
                  <span className="font-mono">₹{order.deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-900 font-bold">
                  <span>Grand Total:</span>
                  <span className="font-black text-red-700 font-mono">₹{order.grandTotal.toFixed(2)}</span>
                </div>
                <div className="mt-2 text-center text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 p-1.5 rounded uppercase">
                  {order.paymentStatus === 'Paid' ? `Paid via ${order.paymentMethod}` : order.paymentStatus}
                </div>
              </div>
            </div>

            <p className="text-center text-[9px] text-zinc-400 mt-6 pt-3 border-t border-dashed border-zinc-200 leading-normal">
              Thank you for choosing Papa Veg Pizza!<br />For support, contact customercare@papavegpizza.com.
            </p>

          </div>
        </div>

        {/* Footer actions */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-end shrink-0 gap-2">
          <button 
            className="h-8 px-4 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-150 dark:hover:bg-zinc-800 text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="h-8 px-4 bg-[var(--primary)] hover:opacity-90 text-white rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md flex items-center gap-1.5"
            onClick={handlePrint}
          >
            <Printer size={13} />
            <span>Generate & Print PDF</span>
          </button>
        </div>

      </div>
    </div>
  );
}
