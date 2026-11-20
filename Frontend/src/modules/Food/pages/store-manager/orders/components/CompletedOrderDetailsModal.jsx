import ComboComponents from "./ComboComponents";
import React from "react";
import { Drawer, Tabs, Collapse, Tag, Divider, Button, Timeline, Rate } from "antd";
import {
  ClipboardList,
  User,
  MapPin,
  Pizza,
  History,
  Bike,
  CreditCard,
  Phone,
  Mail,
  Coins,
  ChevronRight,
  Printer,
  Compass,
  Clock,
  ShieldCheck,
  ExternalLink,
  MessageSquare,
  Gift,
  Percent,
  FileText,
  AlertTriangle,
  Receipt,
  Scale
} from "lucide-react";

export default function CompletedOrderDetailsModal({
  visible,
  onClose,
  order,
  role,
  onDownloadInvoice,
  onReorder
}) {
  if (!order) return null;

  // Reorder and invoices are store-manager tools (as on the Completed Orders list): kitchen staff only look
  const isKitchenStaffView = role === "kitchen_staff";

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  // The delivery partner on this order, as sent by the server
  const assignedRider = order.deliveryPartner || null;
  const gst = order.gst || { rate: 0, taxable: 0, total: order.taxes || 0, cgst: (order.taxes || 0) / 2, sgst: (order.taxes || 0) / 2 };
  const feedback = order.feedback || {};
  const addr = order.deliveryAddress || {};
  const addressLine = [addr.houseNumber, addr.street, addr.landmark, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ");

  const tabItems = [
    // Tab 1: Summary
    {
      key: "summary",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-bold py-1">
          <ClipboardList size={14} />
          Summary
        </span>
      ),
      children: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in text-xs font-semibold">
          {/* Box 1: Core Info */}
          <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800 space-y-4">
            <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200">Order Metadata</h4>
            <div className="space-y-3">
              <div>
                <span className="text-zinc-400 block mb-0.5">Order Number</span>
                <span className="text-slate-800 dark:text-zinc-200 font-extrabold">{order.orderNumber}</span>
              </div>
              <div>
                <span className="text-zinc-400 block mb-0.5">Order Source</span>
                <Tag color="blue" className="font-extrabold border-0 px-2.5 py-0.5 rounded-full capitalize">{order.orderSource || "Website"}</Tag>
              </div>
              <div>
                <span className="text-zinc-400 block mb-0.5">Order Type</span>
                <Tag color={order.orderType === "delivery" ? "purple" : "cyan"} className="font-extrabold border-0 px-2.5 py-0.5 rounded-full capitalize">{order.orderMethodLabel || order.orderType}</Tag>
              </div>
              <div>
                <span className="text-zinc-400 block mb-0.5">Completed Time</span>
                <span className="text-slate-700 dark:text-zinc-300 font-bold">{formatDate(order.deliveredAt || order.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Box 2: Customer Details */}
          <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800 space-y-4">
            <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200">Customer Details</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black">
                  {order.customer?.name?.charAt(0) || "C"}
                </div>
                <div>
                  <span className="text-slate-800 dark:text-zinc-200 font-extrabold block">{order.customer?.name}</span>
                  <span className="text-[10px] text-zinc-400">Customer ID: {order.customerId || "N/A"}</span>
                </div>
              </div>
              <div>
                <span className="text-zinc-400 block mb-0.5">Contact Number</span>
                <span className="text-slate-800 dark:text-zinc-200 font-extrabold flex items-center gap-1">
                  <Phone size={12} className="text-primary" /> {order.customer?.phone}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block mb-0.5">Email Address</span>
                <span className="text-slate-700 dark:text-zinc-300 font-bold flex items-center gap-1">
                  <Mail size={12} className="text-blue-500" /> {order.customer?.email || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block mb-0.5">Orders with this store</span>
                <span className="text-slate-700 dark:text-zinc-300 font-bold">
                  {order.customer?.totalOrdersWithStore ?? 0} total ({order.customer?.previousOrdersCount ?? 0} before this one)
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block mb-0.5">Delivery Address{addr.label ? ` (${addr.label})` : ""}</span>
                <span className="text-slate-700 dark:text-zinc-300 font-bold block leading-snug">{addressLine || "N/A"}</span>
                {addr.recipient && <span className="text-[10px] text-zinc-400 block mt-0.5">Deliver to {addr.recipient}{addr.phone ? ` - ${addr.phone}` : ""}</span>}
                {addr.googleMapsLink && (
                  <a href={addr.googleMapsLink} target="_blank" rel="noreferrer" className="text-[10px] text-primary font-extrabold underline">Open in Maps</a>
                )}
              </div>
              {order.train && (
                <div>
                  <span className="text-zinc-400 block mb-0.5">Train Delivery</span>
                  <span className="text-slate-700 dark:text-zinc-300 font-bold">
                    Train {order.train.trainNo}{order.train.coach ? ` | Coach ${order.train.coach}` : ""}{order.train.seat ? ` | Seat ${order.train.seat}` : ""}{order.train.station ? ` | ${order.train.station}` : ""}
                  </span>
                </div>
              )}
              {addr.notes && (
                <div>
                  <span className="text-zinc-400 block mb-0.5">Customer Note</span>
                  <span className="text-amber-600 dark:text-amber-400 italic font-semibold">{addr.notes}</span>
                </div>
              )}
              <div>
                <span className="text-zinc-400 block mb-0.5">Cutlery</span>
                <span className="text-slate-700 dark:text-zinc-300 font-bold">{order.sendCutlery === false ? "Not required" : "Requested"}</span>
              </div>
            </div>
          </div>

          {/* Box 3: Logistics Details */}
          <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800 space-y-4">
            <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200">Delivery Partner</h4>
            {order.orderType === "pickup" ? (
              <div className="py-6 text-center text-zinc-400">
                <MapPin size={24} className="mx-auto mb-1.5 text-zinc-400" />
                <span className="font-extrabold uppercase text-[10px] tracking-wider">Customer Self-Pickup</span>
              </div>
            ) : assignedRider ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400 flex items-center justify-center font-bold">
                    {assignedRider.name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-slate-800 dark:text-zinc-200 font-extrabold block">{assignedRider.name}</span>
                    <span className="text-[10px] text-zinc-400">{assignedRider.phone || "Partner ID: " + String(assignedRider._id).slice(-6).toUpperCase()}</span>
                  </div>
                </div>
                <div>
                  <span className="text-zinc-400 block mb-0.5">Order Duration (placed to delivered)</span>
                  <span className="text-slate-855 dark:text-zinc-200 font-extrabold flex items-center gap-1">
                    <Clock size={12} className="text-primary" /> {order.totalDuration != null ? `${order.totalDuration} Minutes` : "Not delivered yet"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block mb-0.5">Vehicle Details</span>
                  <span className="text-slate-700 dark:text-zinc-300 font-bold uppercase">{[assignedRider.vehicleType, assignedRider.vehicleName, assignedRider.vehicleNumber].filter(Boolean).join(" | ") || "Not provided"}</span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-red-500">
                <AlertTriangle size={24} className="mx-auto mb-1.5 text-red-500" />
                <span className="font-extrabold uppercase text-[10px]">No rider assigned yet</span>
              </div>
            )}
          </div>
        </div>
      )
    },

    // Tab 2: Items
    {
      key: "items",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-bold py-1">
          <Pizza size={14} />
          Items
        </span>
      ),
      children: (
        <div className="space-y-3 animate-fade-in">
          <Collapse
            defaultActiveKey={["0", "1", "2"]}
            ghost
            expandIconPosition="end"
            className="completed-items-collapse"
          >
            {order.items?.map((item, index) => (
              <Collapse.Panel
                key={index.toString()}
                header={
                  <div className="flex justify-between items-center w-full pr-4 text-xs font-extrabold text-slate-800 dark:text-zinc-200">
                    <div className="flex items-center gap-3">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl object-cover border border-zinc-200 dark:border-zinc-800 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                          <Pizza size={18} />
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-black block">{item.name}</span>
                        <span className="text-[10px] text-zinc-450 dark:text-zinc-450 uppercase">{item.size} | {item.variant}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <span>Qty: <span className="text-primary font-black">x{item.quantity}</span></span>
                      <span>{formatCurrency(item.subtotal)}</span>
                    </div>
                  </div>
                }
              >
                <div className="pl-12 py-2 text-xs border-t border-zinc-100 dark:border-zinc-800/60 font-semibold space-y-2 text-slate-700 dark:text-zinc-350">
                  <ComboComponents item={item} />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-zinc-400 block mb-0.5">Crust / Variant</span>
                      <span className="text-slate-800 dark:text-zinc-200">{item.customizations?.crustType || item.variant || "Not specified"}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block mb-0.5">Unit Price</span>
                      <span className="text-slate-800 dark:text-zinc-200">{formatCurrency(item.unitPrice)}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-zinc-400 block mb-0.5">Extra Toppings</span>
                      <span className="text-slate-800 dark:text-zinc-200">
                        {item.customizations?.extraToppings && item.customizations.extraToppings.length > 0
                          ? item.customizations.extraToppings.join(", ")
                          : "None"}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-zinc-400 block mb-0.5">Special Instructions</span>
                      <span className="text-amber-600 dark:text-amber-400 italic">
                        {item.customizations?.specialInstructions || "None"}
                      </span>
                    </div>
                  </div>
                </div>
              </Collapse.Panel>
            ))}
          </Collapse>
        </div>
      )
    },

    // Tab 3: Charges
    {
      key: "charges",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-bold py-1">
          <Coins size={14} />
          Charges
        </span>
      ),
      children: (
        <div className="max-w-md mx-auto bg-slate-50 dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800 text-xs font-bold space-y-3 animate-fade-in text-slate-700 dark:text-zinc-300">
          <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200 mb-2">Order Bill Invoice Details</h4>
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-green-600 dark:text-green-400">
              <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
              <span>- {formatCurrency(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Taxes & GST{gst.rate ? ` (${gst.rate}%)` : ""}</span>
            <span>{formatCurrency(order.taxes)}</span>
          </div>
          <div className="flex justify-between">
            <span>Packing Charges</span>
            <span>{formatCurrency(order.packingCharges)}</span>
          </div>
          <div className="flex justify-between">
            <span>Platform Fee</span>
            <span>{formatCurrency(order.platformFee)}</span>
          </div>
          <div className="flex justify-between">
            <span>Handling Fee</span>
            <span>{formatCurrency(order.handlingFee)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Charges</span>
            <span>{formatCurrency(order.deliveryCharges)}</span>
          </div>
          {order.tipAmount > 0 && (
            <div className="flex justify-between">
              <span>Rider Tip</span>
              <span>{formatCurrency(order.tipAmount)}</span>
            </div>
          )}
          <Divider className="my-2 border-zinc-200 dark:border-zinc-800" />
          <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white">
            <span>Grand Total</span>
            <span className="text-primary">{formatCurrency(order.grandTotal)}</span>
          </div>
        </div>
      )
    },

    // Tab 4: Coupon Details
    {
      key: "coupon",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-bold py-1">
          <Gift size={14} />
          Coupons
        </span>
      ),
      children: (
        <div className="max-w-md mx-auto bg-slate-50 dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800 text-xs font-semibold space-y-4 animate-fade-in">
          <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1">
            <Percent size={14} className="text-primary" /> Coupon Code Details
          </h4>
          {order.couponCode ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Promo Code</span>
                <span className="text-xs bg-primary/10 text-primary border border-primary/20 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {order.couponCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Campaign Name</span>
                <span className="text-slate-805 dark:text-zinc-200 font-extrabold text-right">{order.coupon?.title || order.couponCampaignName || "Not available"}</span>
              </div>
              {order.coupon?.description && (
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-400 shrink-0">Description</span>
                  <span className="text-slate-700 dark:text-zinc-300 font-bold text-right">{order.coupon.description}</span>
                </div>
              )}
              {order.coupon?.offer && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Offer</span>
                  <span className="text-slate-700 dark:text-zinc-300 font-bold">{order.coupon.offer}</span>
                </div>
              )}
              {order.coupon?.minimumOrderAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Minimum Order</span>
                  <span className="text-slate-700 dark:text-zinc-300 font-bold">{formatCurrency(order.coupon.minimumOrderAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-400">Order Subtotal</span>
                <span className="text-slate-700 dark:text-zinc-300 font-bold">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Discount Amount</span>
                <span className="text-green-600 font-extrabold">- {formatCurrency(order.discountAmount)}{order.coupon?.savedPercent ? ` (${order.coupon.savedPercent}% saved)` : ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Coupon Status</span>
                <Tag color="success" className="font-extrabold border-0 px-2 py-0.5 rounded-full text-[10px] m-0">Applied</Tag>
              </div>
              {order.coupon?.matchedFromUsage && (
                <p className="text-[10px] text-zinc-400 font-medium italic leading-snug">
                  This order did not save its coupon code. It was matched from the coupon this customer used at the time of the order.
                </p>
              )}
            </div>
          ) : (
            <div className="py-6 text-center text-zinc-400">
              <Gift size={24} className="mx-auto mb-1.5 text-zinc-400" />
              {order.discountAmount > 0 ? (
                <span>A discount of {formatCurrency(order.discountAmount)} was applied. The coupon code was not recorded on this order.</span>
              ) : (
                <span>No Promo Coupon code was applied to this order.</span>
              )}
            </div>
          )}
        </div>
      )
    },

    // Tab 5: Taxes
    {
      key: "taxes",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-bold py-1">
          <Receipt size={14} />
          GST Taxes
        </span>
      ),
      children: (
        <div className="max-w-md mx-auto bg-slate-50 dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800 text-xs font-semibold space-y-4 animate-fade-in">
          <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200">GST Breakdown{gst.rate ? ` (${gst.rate}%)` : ""}</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-zinc-400">Order Number</span>
              <span className="text-slate-855 dark:text-zinc-200 font-mono font-bold">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Taxable Amount</span>
              <span className="text-slate-705 dark:text-zinc-300 font-bold">{formatCurrency(gst.taxable)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">CGST{gst.rate ? ` (${gst.rate / 2}%)` : ""}</span>
              <span className="text-slate-705 dark:text-zinc-300 font-bold">{formatCurrency(gst.cgst)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">SGST{gst.rate ? ` (${gst.rate / 2}%)` : ""}</span>
              <span className="text-slate-705 dark:text-zinc-300 font-bold">{formatCurrency(gst.sgst)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Total Tax Paid by Customer</span>
              <span className="text-slate-855 dark:text-zinc-200 font-extrabold">{formatCurrency(gst.total)}</span>
            </div>
          </div>
        </div>
      )
    },

    // Tab 6: Timeline
    {
      key: "timeline",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-bold py-1">
          <History size={14} />
          Timeline
        </span>
      ),
      children: (
        <div className="max-w-md mx-auto bg-white dark:bg-zinc-900/40 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-850 animate-fade-in">
          <Timeline className="pt-2 font-semibold text-xs completed-timeline">
            {order.timeline?.map((evt, idx) => (
              <Timeline.Item
                key={idx}
                color={evt.status === "completed" || evt.status === "delivered" ? "green" : "blue"}
              >
                <div className="text-xs">
                  <span className="font-extrabold capitalize text-slate-800 dark:text-zinc-200 block text-xs">
                    {evt.status.replace("_", " ")}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium block mt-0.5">{formatDate(evt.timestamp)}</span>
                  <span className="text-[10px] text-zinc-500 font-medium italic block mt-0.5">{evt.note}</span>
                </div>
              </Timeline.Item>
            ))}
          </Timeline>
        </div>
      )
    },

    // Tab 7: Payment Details
    {
      key: "payment",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-bold py-1">
          <CreditCard size={14} />
          Payments
        </span>
      ),
      children: (
        <div className="max-w-md mx-auto bg-slate-50 dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800 text-xs font-semibold space-y-4 animate-fade-in">
          <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200">Transaction Details</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-zinc-400">Transaction ID</span>
              <span className="text-slate-855 dark:text-zinc-200 font-mono font-bold">{order.transactionId || (order.paymentMethod === "COD" ? "None (cash on delivery)" : "Not available")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Payment Method</span>
              <span className="text-slate-855 dark:text-zinc-200 font-bold uppercase">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Payment Gateway</span>
              <span className="text-slate-705 dark:text-zinc-300 font-bold">{order.paymentGateway || "N/A"}</span>
            </div>
            {order.gatewayOrderId && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Gateway Order ID</span>
                <span className="text-slate-705 dark:text-zinc-300 font-mono font-bold">{order.gatewayOrderId}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-400">Amount Paid</span>
              <span className="text-slate-855 dark:text-zinc-200 font-extrabold">{formatCurrency(order.amountPaid)} <span className="text-zinc-400 font-semibold">of {formatCurrency(order.grandTotal)}</span></span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Payment Status</span>
              <Tag color={order.paymentStatus === "paid" ? "success" : order.paymentStatus === "refunded" ? "error" : "warning"} className="font-extrabold border-0 px-2 py-0.5 rounded-full text-[10px] m-0">{order.paymentStatusLabel || (order.paymentStatus === "paid" ? "Paid" : "Pending")}</Tag>
            </div>
            {(order.refundStatus === "processed" || order.refundStatus === "pending" || order.refundStatus === "failed" || order.refundAmount > 0) && (
              <>
                <Divider className="my-2 border-zinc-200 dark:border-zinc-800" />
                <div className="flex justify-between text-red-500 font-extrabold">
                  <span>Refund Status</span>
                  <Tag color="error" className="font-extrabold border-0 px-2 py-0.5 rounded-full text-[10px] m-0 capitalize">{order.refundStatus}</Tag>
                </div>
                <div className="flex justify-between text-red-500">
                  <span>Refund Amount</span>
                  <span>{formatCurrency(order.refundAmount)}</span>
                </div>
                <div className="flex justify-between text-red-500">
                  <span>Refund TXN ID</span>
                  <span className="font-mono font-bold">{order.refundTransactionId || "Not available"}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )
    },

    // Tab 8: Feedback
    {
      key: "feedback",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-bold py-1">
          <MessageSquare size={14} />
          Feedback
        </span>
      ),
      children: (
        <div className="max-w-md mx-auto bg-slate-50 dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800 text-xs font-semibold space-y-4 animate-fade-in">
          <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200">Customer Review & Feedback</h4>
          {!feedback.store && !feedback.deliveryPartner ? (
            <div className="py-6 text-center text-zinc-400">
              <MessageSquare size={24} className="mx-auto mb-1.5 text-zinc-400" />
              <span>The customer has not rated this order yet.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {[["Store & Food", feedback.store], ["Delivery Partner", feedback.deliveryPartner]].map(([label, r]) => (
                <div key={label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">{label}</span>
                    {r ? <Rate disabled value={r.rating} className="text-yellow-500 text-xs" /> : <span className="text-zinc-400 font-semibold">Not rated</span>}
                  </div>
                  {r?.comment ? (
                    <p className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/40 p-3 rounded-2xl text-slate-700 dark:text-zinc-300 font-semibold italic text-xs leading-relaxed">
                      "{r.comment}"
                    </p>
                  ) : r ? (
                    <p className="text-[10px] text-zinc-400 font-medium">No written comment.</p>
                  ) : null}
                  {r?.ratedAt && <span className="text-[10px] text-zinc-400 block">Rated on {formatDate(r.ratedAt)}</span>}
                </div>
              ))}
              {feedback.storeReply && (
                <>
                  <Divider className="my-2 border-zinc-200 dark:border-zinc-800" />
                  <div>
                    <span className="text-zinc-450 block mb-1">Store Reply{feedback.storeReply.repliedBy ? ` by ${feedback.storeReply.repliedBy}` : ""}</span>
                    <p className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/40 p-3 rounded-2xl text-slate-700 dark:text-zinc-300 font-semibold text-xs leading-relaxed">{feedback.storeReply.text}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 pr-8 w-full">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-primary" />
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Historical Completed Details</h3>
              <p className="text-[10px] text-zinc-400 font-semibold">Audit logs, invoice taxations, and rating details</p>
            </div>
          </div>
          <div className="pr-4">
            <Tag color={order.status === "completed" ? "success" : "processing"} className="font-extrabold px-3 py-0.5 rounded-full border-0 capitalize">
              {order.status}
            </Tag>
          </div>
        </div>
      }
      open={visible}
      onClose={onClose}
      width={1200}
      destroyOnClose
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
          <div className="flex gap-2">
            {/* Hidden for kitchen staff */}
            {!isKitchenStaffView && (
              <Button
                onClick={() => onReorder(order)}
                className="text-xs font-bold !bg-primary hover:!bg-primary-hover border-0 !text-white rounded-full px-5 py-2 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer flex items-center gap-1"
              >
                <History size={12} />
                Reorder Items
              </Button>
            )}

            {!isKitchenStaffView && (
              <Button
                onClick={() => onDownloadInvoice(order)}
                className="text-xs font-bold !border-primary/45 !text-primary bg-white dark:bg-zinc-900 hover:!bg-primary/5 hover:!border-primary hover:!text-primary-hover active:scale-95 transition-all cursor-pointer rounded-full px-4 py-2 shadow-sm flex items-center gap-1.5"
              >
                <FileText size={12} className="text-primary" />
                Invoice Options
              </Button>
            )}
          </div>

          <Button
            key="close"
            onClick={onClose}
            className="text-xs font-bold border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-full px-4 py-2 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
          >
            Close Details
          </Button>
        </div>
      }
    >
      <Tabs defaultActiveKey="summary" items={tabItems} className="completed-details-tabs" />
    </Drawer>
  );
}
