import React from "react";
import { Modal } from "antd";
import { Printer, XCircle, QrCode } from "lucide-react";

export default function PrintLabelModal({ visible, onClose, order }) {
  if (!order) return null;

  const handlePrint = () => {
    const printContent = document.getElementById("printable-label-content").innerHTML;
    const printWindow = window.open("", "_blank", "width=400,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>Order Label #${order.orderNumber}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 72mm;
              margin: 0 auto;
              padding: 15px 5px;
              font-size: 12px;
              color: #000;
              background: #fff;
              line-height: 1.4;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .text-large { font-size: 16px; font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .item-table { width: 100%; border-collapse: collapse; margin: 8px 0; }
            .item-table th { border-bottom: 1px solid #000; text-align: left; }
            .qr-container { display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 12px 0; }
            .barcode { font-family: 'Libre Barcode 39', monospace; font-size: 28px; text-align: center; margin-top: 4px; }
          </style>
        </head>
        <body onload="window.print(); setTimeout(() => { window.close(); }, 500);">
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${order.orderNumber}`;

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <Printer size={18} className="text-[var(--primary)]" />
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Print Dispatch Label</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 mt-0.5">
              Print thermal label for order package identification
            </p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={460}
      centered
      footer={
        <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--sa-primary-hover)] text-white font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <Printer size={12} />
            Print Thermal Label
          </button>
        </div>
      }
    >
      <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        
        {/* Order Details Preview panel */}
        <div className="space-y-3.5">
          <h4 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
            Order Metadata
          </h4>

          <div className="space-y-2.5">
            <div className="bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-850">
              <span className="text-[8px] font-black text-slate-400 block uppercase">Pickup Number</span>
              <span className="text-sm font-black text-[var(--primary)]">{order.pickup_number || "P-101"}</span>
            </div>

            <div>
              <span className="text-[9px] font-bold text-slate-400 block uppercase">Customer</span>
              <span className="font-extrabold text-slate-800 dark:text-zinc-200 block">{order.customer?.name}</span>
              <span className="font-semibold text-slate-500 block">{order.customer?.phone}</span>
            </div>

            {order.deliveryType === "Delivery" && order.customer?.deliveryAddress && (
              <div>
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Address</span>
                <span className="font-semibold text-slate-600 dark:text-zinc-300 block leading-relaxed">
                  {order.customer.deliveryAddress.street}, {order.customer.deliveryAddress.area}, {order.customer.deliveryAddress.city} - {order.customer.deliveryAddress.zipcode}
                </span>
              </div>
            )}

            <div>
              <span className="text-[9px] font-bold text-slate-400 block uppercase">Fulfillment</span>
              <span className="font-extrabold text-slate-800 dark:text-zinc-200">{order.deliveryType}</span>
            </div>
          </div>
        </div>

        {/* Thermal Label Preview Panel */}
        <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl border border-slate-200/50 dark:border-zinc-850 space-y-2 select-none">
          <h4 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider text-center border-b border-slate-200 dark:border-zinc-850 pb-1 mb-2">
            Thermal Label Preview
          </h4>

          {/* Label Inner */}
          <div 
            id="printable-label-content" 
            className="bg-white text-zinc-950 p-3 rounded-lg border border-zinc-200 shadow-sm max-w-[240px] mx-auto font-mono text-[9px] leading-tight"
          >
            <div className="text-center">
              <span className="text-xs font-black block tracking-widest">PAPA VEG PIZZA</span>
              <span className="text-[7px] text-zinc-500 block">Indore Store Operations</span>
              <div className="divider"></div>
              <span className="text-xs font-bold block">ORDER #{order.orderNumber}</span>
              <span className="font-bold text-[8px]">Type: {order.deliveryType.toUpperCase()}</span>
              <div className="divider"></div>
            </div>

            {/* Customer Details */}
            <div className="space-y-0.5">
              <div><span className="font-bold">Cust:</span> {order.customer?.name}</div>
              <div><span className="font-bold">Phone:</span> {order.customer?.phone}</div>
              {order.deliveryType === "Delivery" && order.customer?.deliveryAddress && (
                <div className="leading-snug">
                  <span className="font-bold">Addr:</span> {order.customer.deliveryAddress.street}, {order.customer.deliveryAddress.area}, {order.customer.deliveryAddress.city}
                </div>
              )}
            </div>

            <div className="divider"></div>

            {/* Items */}
            <table className="item-table text-[9px] w-full">
              <thead>
                <tr>
                  <th className="font-bold pb-0.5">Item</th>
                  <th className="font-bold text-right pb-0.5">Qty</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((it, idx) => (
                  <tr key={idx} className="border-b border-zinc-100">
                    <td className="py-1">{it.name} ({it.size})</td>
                    <td className="py-1 text-right font-bold">{it.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="divider"></div>

            {/* QR Code Container */}
            <div className="qr-container">
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                className="w-20 h-20 border border-zinc-150 p-1"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <div className="hidden flex-col items-center justify-center border border-zinc-150 p-2 rounded">
                <QrCode size={40} className="text-zinc-500" />
                <span className="text-[7px] text-zinc-450 mt-1 font-bold">QR Server Offline</span>
              </div>
              <span className="text-[8px] font-bold mt-1 text-center block">Scan to verify pickup</span>
            </div>

            <div className="divider"></div>

            {/* Pickup Badge */}
            <div className="text-center font-bold text-xs py-1 border border-zinc-950 rounded">
              PICKUP NO: {order.pickup_number || "P-101"}
            </div>

            <div className="text-center font-bold text-[8px] mt-2 block uppercase tracking-wide">
              *** Thank You ***
            </div>
          </div>
        </div>

      </div>
    </Modal>
  );
}
