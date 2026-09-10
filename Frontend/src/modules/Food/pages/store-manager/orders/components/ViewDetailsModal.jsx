import React from "react";
import { Modal, Tabs, Collapse, Tag, Divider, Button } from "antd";
import {
  ClipboardList,
  User,
  MapPin,
  Pizza,
  CreditCard,
  History,
  CheckCircle,
  ExternalLink,
  Phone,
  Mail,
  Coins,
  ChevronRight,
  Printer,
  XCircle,
  Check
} from "lucide-react";

export default function ViewDetailsModal({
  visible,
  onClose,
  order,
  role,
  onAccept,
  onReject,
  onPrint
}) {
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
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  // Render priority tag
  const renderPriorityTag = (priority) => {
    const isUrgent = priority?.toLowerCase() === "urgent";
    return (
      <Tag color={isUrgent ? "volcano" : "blue"} className="font-extrabold capitalize px-2.5 py-0.5 rounded-full border-0">
        {priority || "Normal"}
      </Tag>
    );
  };

  // Render status tag
  const renderStatusTag = (status) => {
    switch (status) {
      case "payment_verified":
        return <Tag color="green" className="font-bold">Payment Verified</Tag>;
      case "awaiting_confirmation":
        return <Tag color="orange" className="font-bold">Awaiting Confirmation</Tag>;
      case "confirmed":
        return <Tag color="blue" className="font-bold">Confirmed</Tag>;
      case "cancelled":
        return <Tag color="red" className="font-bold">Cancelled</Tag>;
      default:
        return <Tag color="default" className="font-bold capitalize">{status}</Tag>;
    }
  };

  // Tabs Content configuration
  const tabItems = [
    {
      key: "details",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-bold py-1">
          <ClipboardList size={14} />
          Order
        </span>
      ),
      children: (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800">
            <div>
              <p className="text-zinc-400 font-semibold mb-0.5">Order Number</p>
              <p className="text-slate-900 dark:text-white font-extrabold text-sm">{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-zinc-400 font-semibold mb-0.5">Status</p>
              <div className="mt-0.5">{renderStatusTag(order.status)}</div>
            </div>
            <div>
              <p className="text-zinc-400 font-semibold mb-0.5">Order Source</p>
              <Tag color="cyan" className="font-bold border-0 px-2 py-0.5 rounded-full mt-0.5">{order.orderSource || "Website"}</Tag>
            </div>
            <div>
              <p className="text-zinc-400 font-semibold mb-0.5">Order Type</p>
              <Tag color="purple" className="font-bold border-0 px-2 py-0.5 rounded-full mt-0.5 capitalize">{order.orderType}</Tag>
            </div>
            <div>
              <p className="text-zinc-400 font-semibold mb-0.5">Received Time</p>
              <p className="text-slate-800 dark:text-zinc-350 font-bold">{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-zinc-400 font-semibold mb-0.5">Scheduled Time</p>
              <p className="text-slate-800 dark:text-zinc-350 font-bold">{formatDate(order.scheduledTime) || "Immediate"}</p>
            </div>
            <div>
              <p className="text-zinc-400 font-semibold mb-0.5">Priority</p>
              <div className="mt-0.5">{renderPriorityTag(order.priority)}</div>
            </div>
            <div>
              <p className="text-zinc-400 font-semibold mb-0.5">Estimated Prep Duration</p>
              <p className="text-slate-850 dark:text-zinc-300 font-extrabold text-sm">
                {order.estimatedPreparationTime ? `${order.estimatedPreparationTime} Mins` : "Not Assigned"}
              </p>
            </div>
          </div>
          {order.notes && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl">
              <h5 className="font-extrabold text-amber-800 dark:text-amber-400 mb-1 text-[11px] uppercase tracking-wider">Kitchen Notes / Instructions:</h5>
              <p className="text-amber-900 dark:text-amber-300 font-medium text-xs leading-relaxed">{order.notes}</p>
            </div>
          )}
        </div>
      )
    },
    {
      key: "customer",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-bold py-1">
          <User size={14} />
          Customer
        </span>
      ),
      children: (
        <div className="space-y-4 text-xs">
          <div className="flex items-center gap-3 bg-muted p-4 rounded-2xl border border-border">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-sm shadow-sm shrink-0">
              {order.customer?.name ? order.customer.name.charAt(0) : "C"}
            </div>
            <div>
              <h4 className="font-black text-sm text-foreground leading-tight">{order.customer?.name}</h4>
              <p className="text-zinc-400 font-bold text-[10px] mt-0.5">Customer ID: {order.customerId || "N/A"}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
              <Phone size={14} className="text-slate-400" />
              <div>
                <p className="text-zinc-400 font-semibold text-[10px] mb-0.5">Phone Number</p>
                <p className="text-foreground font-bold">{order.customer?.phone || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
              <Mail size={14} className="text-slate-400" />
              <div className="min-w-0">
                <p className="text-zinc-400 font-semibold text-[10px] mb-0.5">Email Address</p>
                <p className="text-foreground font-bold truncate">{order.customer?.email || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
              <Coins size={14} className="text-amber-500" />
              <div>
                <p className="text-zinc-400 font-semibold text-[10px] mb-0.5">Loyalty Points</p>
                <p className="text-foreground font-black">{order.customer?.loyaltyPoints || 0} pts</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
              <ClipboardList size={14} className="text-blue-500" />
              <div>
                <p className="text-zinc-400 font-semibold text-[10px] mb-0.5">Previous Orders</p>
                <p className="text-foreground font-black">{order.customer?.previousOrdersCount || 0} orders</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      key: "delivery",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-bold py-1">
          <MapPin size={14} />
          Address
        </span>
      ),
      children: (
        <div className="space-y-4 text-xs">
          <div className="bg-muted p-4 rounded-2xl border border-border space-y-3">
            <div>
              <p className="text-zinc-400 font-semibold mb-0.5">Complete Address</p>
              <p className="text-foreground font-bold text-sm leading-snug">
                {order.deliveryAddress?.houseNumber}, {order.deliveryAddress?.street}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-zinc-400 font-semibold mb-0.5">Landmark</p>
                <p className="text-slate-800 dark:text-zinc-350 font-semibold">{order.deliveryAddress?.landmark || "N/A"}</p>
              </div>
              <div>
                <p className="text-zinc-400 font-semibold mb-0.5">City & Pincode</p>
                <p className="text-slate-800 dark:text-zinc-350 font-semibold">
                  {order.deliveryAddress?.city} - {order.deliveryAddress?.pincode}
                </p>
              </div>
            </div>

            {order.deliveryAddress?.googleMapsLink && (
              <a
                href={order.deliveryAddress.googleMapsLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-455 font-bold rounded-lg transition-colors border border-rose-100 dark:border-rose-900/20 mt-1"
              >
                <MapPin size={12} />
                <span>Open in Google Maps</span>
                <ExternalLink size={10} />
              </a>
            )}
          </div>
          {order.deliveryAddress?.notes && (
            <div className="p-3 bg-muted border border-border rounded-xl">
              <h5 className="font-extrabold text-zinc-550 mb-1 text-[10px] uppercase tracking-wider">Rider Delivery Notes:</h5>
              <p className="text-foreground font-medium">{order.deliveryAddress.notes}</p>
            </div>
          )}
        </div>
      )
    },
    {
      key: "items",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-bold py-1">
          <Pizza size={14} />
          Items ({order.items?.length || 0})
        </span>
      ),
      children: (
        <div className="space-y-3">
          <Collapse
            defaultActiveKey={["0"]}
            ghost
            expandIconPosition="end"
            className="custom-items-collapse"
          >
            {order.items?.map((item, index) => (
              <Collapse.Panel
                header={
                  <div className="flex items-center justify-between w-full pr-4 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 object-cover rounded-lg shadow-sm border border-border shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-extrabold shrink-0">
                          P
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-foreground truncate">{item.name}</h4>
                        <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
                          {item.size} • {item.variant}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-extrabold text-foreground">
                        {item.quantity} x {formatCurrency(item.unitPrice)}
                      </p>
                      <p className="text-[11px] font-black text-primary mt-0.5">
                        {formatCurrency(item.subtotal)}
                      </p>
                    </div>
                  </div>
                }
                key={index.toString()}
                className="mb-2 bg-muted border border-border rounded-2xl overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                <div className="px-4 pb-4 text-[11px] border-t border-border pt-3 mt-1 space-y-2.5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    <div>
                      <p className="text-zinc-400 font-bold uppercase text-[9px] mb-0.5">Crust Type</p>
                      <p className="text-foreground font-extrabold">{item.customizations?.crustType || "Standard"}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400 font-bold uppercase text-[9px] mb-0.5">Cheese Level</p>
                      <p className="text-foreground font-extrabold">{item.customizations?.cheeseLevel || "Standard"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-zinc-400 font-bold uppercase text-[9px] mb-0.5">Extra Toppings</p>
                      <p className="text-foreground font-semibold leading-snug">
                        {item.customizations?.extraToppings?.length > 0
                          ? item.customizations.extraToppings.join(", ")
                          : "None"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border-t border-border pt-2.5">
                    <div>
                      <p className="text-zinc-400 font-bold uppercase text-[9px] mb-0.5">Ingredients Removed</p>
                      <p className="text-rose-605 font-bold">
                        {item.customizations?.removeIngredients?.length > 0
                          ? item.customizations.removeIngredients.join(", ")
                          : "None"}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-400 font-bold uppercase text-[9px] mb-0.5">Special Instructions</p>
                      <p className="text-foreground font-semibold leading-relaxed">
                        {item.customizations?.specialInstructions || "None"}
                      </p>
                    </div>
                  </div>
                </div>
              </Collapse.Panel>
            ))}
          </Collapse>
        </div>
      )
    },
    {
      key: "payment",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-bold py-1">
          <CreditCard size={14} />
          Payment
        </span>
      ),
      children: (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3 bg-muted p-4 rounded-2xl border border-border">
            <div>
              <p className="text-zinc-400 font-semibold mb-0.5">Method</p>
              <p className="text-foreground font-extrabold">{order.paymentMethod || "Online"}</p>
            </div>
            <div>
              <p className="text-zinc-400 font-semibold mb-0.5">Payment Status</p>
              <Tag color={order.paymentStatus === "paid" ? "green" : "red"} className="font-bold border-0 px-2 rounded-full m-0.5">
                {order.paymentStatus === "paid" ? "Paid" : "Pending"}
              </Tag>
            </div>
            <div>
              <p className="text-zinc-400 font-semibold mb-0.5">Txn ID</p>
              <p className="text-foreground font-mono text-[10px] truncate">{order.transactionId || "TXN-8840192A"}</p>
            </div>
          </div>

          <div className="space-y-2 bg-card border border-border p-4 rounded-2xl shadow-sm">
            <div className="flex justify-between font-bold text-zinc-550">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.couponId && (
              <div className="flex justify-between font-bold text-emerald-600">
                <span>Coupon Discount ({order.couponId})</span>
                <span>-{formatCurrency(order.discountAmount || 0)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-zinc-550">
              <span>GST & Taxes</span>
              <span>{formatCurrency(order.taxes || 0)}</span>
            </div>
            <div className="flex justify-between font-bold text-zinc-550">
              <span>Packing Charges</span>
              <span>{formatCurrency(order.packingCharges || 0)}</span>
            </div>
            <div className="flex justify-between font-bold text-zinc-550">
              <span>Delivery Charges</span>
              <span>{formatCurrency(order.deliveryCharges || 0)}</span>
            </div>
            <Divider className="my-1.5 border-border" />
            <div className="flex justify-between items-center text-sm font-black text-foreground">
              <span>Grand Total</span>
              <span className="text-base text-primary">{formatCurrency(order.grandTotal)}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      key: "timeline",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-bold py-1">
          <History size={14} />
          Timeline
        </span>
      ),
      children: (
        <div className="py-2 pl-4 text-xs">
          <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 space-y-6">
            
            {/* Timeline Item: Payment Verified */}
            <div className="relative pl-6">
              <span className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10" />
              <div>
                <h5 className="font-extrabold text-slate-900 dark:text-white text-xs">Payment Verified</h5>
                <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                  Verified via {order.paymentMethod || "Online"} settlement gateway.
                </p>
                <p className="text-[10px] text-zinc-500 font-bold mt-1">{formatDate(order.createdAt)}</p>
              </div>
            </div>

            {/* Timeline Item: Order Created */}
            <div className="relative pl-6">
              <span className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-500/10" />
              <div>
                <h5 className="font-extrabold text-slate-900 dark:text-white text-xs">Order Placed</h5>
                <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                  Order registered in MongoDB collection for store operations.
                </p>
                <p className="text-[10px] text-zinc-500 font-bold mt-1">{formatDate(order.createdAt)}</p>
              </div>
            </div>

            {/* Timeline Item: Current State */}
            <div className="relative pl-6">
              <span className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-500/10 animate-pulse" />
              <div>
                <h5 className="font-extrabold text-slate-900 dark:text-white text-xs capitalize">Awaiting Action</h5>
                <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                  Order is pending approval or kitchen dispatch assignment.
                </p>
                <Tag color="orange" className="mt-1.5 font-extrabold capitalize text-[9px] border-0 px-2 rounded-full">
                  {order.status}
                </Tag>
              </div>
            </div>
            
          </div>
        </div>
      )
    }
  ];

  // Role permissions
  const isManager = role === "store_manager";
  const isSupervisor = role === "kitchen_supervisor";
  const isAwaitingAction = order.status === "payment_verified" || order.status === "awaiting_confirmation";

  return (
    <Modal
      title={
        <div className="flex items-center justify-between pr-8 border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-900 dark:text-white">
              Order Details
            </span>
            <span className="text-xs font-mono font-bold text-zinc-400">
              #{order.orderNumber}
            </span>
          </div>
          <div>{renderStatusTag(order.status)}</div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={680}
      centered
      destroyOnClose
      footer={
        <div className="flex items-center justify-between border-t border-border pt-3.5 mt-2 gap-2 flex-wrap">
          {/* Left: Print receipt (allowed for Managers & Supervisors) */}
          {(isManager || isSupervisor) ? (
            <Button
              icon={<Printer size={13} />}
              onClick={() => onPrint(order)}
              className="text-xs font-bold border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-full px-4 py-2 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              Print Receipt
            </Button>
          ) : (
            <div />
          )}

          {/* Right: Operational Actions */}
          <div className="flex items-center gap-2">
            <Button
              onClick={onClose}
              className="text-xs font-bold border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-full px-4 py-2 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
            >
              Close
            </Button>

            {/* Reject Button (Only Manager has access to cancel orders) */}
            {isManager && isAwaitingAction && (
              <Button
                danger
                icon={<XCircle size={13} />}
                onClick={() => onReject(order)}
                className="text-xs font-bold border border-rose-250 dark:border-rose-800 bg-white dark:bg-zinc-900 text-rose-600 rounded-full px-4 py-2 shadow-sm hover:bg-rose-50 dark:hover:bg-rose-950/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                Reject Order
              </Button>
            )}

            {/* Accept Button (Managers and Kitchen Supervisors can confirm orders) */}
            {(isManager || isSupervisor) && isAwaitingAction && (
              <Button
                type="primary"
                icon={<Check size={13} />}
                onClick={() => onAccept(order)}
                className="text-xs font-bold !bg-primary hover:!bg-primary-hover border-0 text-white rounded-full px-4 py-2 flex items-center gap-1.5 shadow-md shadow-primary/15 active:scale-95 transition-all cursor-pointer"
              >
                Accept Order
              </Button>
            )}
          </div>
        </div>
      }
      className="custom-order-details-modal dark:bg-zinc-900 dark:text-white"
    >
      <div className="py-2 max-h-[60vh] overflow-y-auto pr-1">
        <Tabs items={tabItems} defaultActiveKey="details" className="order-details-tabs" />
      </div>
    </Modal>
  );
}
