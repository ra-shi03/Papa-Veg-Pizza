import React from "react";
import { Modal, Tabs, Collapse, Tag, Divider, Button, Timeline } from "antd";
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
  UserCheck,
  Compass,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ExternalLink
} from "lucide-react";

export default function ReadyOrderDetailsModal({
  visible,
  onClose,
  order,
  role,
  onAssignRider,
  onConfirmPickup,
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

  const calculateWaitingDuration = () => {
    const readyTime = new Date(order.readyAt || order.createdAt);
    const diffMs = new Date() - readyTime;
    const diffMins = Math.max(0, Math.round(diffMs / 60000));
    return `${diffMins} Minutes`;
  };

  // Lookup rider from local storage riders DB
  const assignedRider = order.deliveryPartnerId
    ? (JSON.parse(localStorage.getItem("pvp_riders")) || []).find((r) => r._id === order.deliveryPartnerId)
    : null;

  const isDelivery = order.orderType === "delivery";
  const isRiderAssigned = !!order.deliveryPartnerId;

  // Role permissions
  const isKitchenStaff = role === "kitchen_staff";

  const tabItems = [
    {
      key: "details",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-bold py-1">
          <User size={14} />
          Customer
        </span>
      ),
      children: (
        <div className="space-y-4 text-xs font-semibold">
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0">
              {order.customer?.name ? order.customer.name.charAt(0) : "C"}
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-800 dark:text-zinc-200 leading-tight">{order.customer?.name}</h4>
              <p className="text-zinc-400 font-bold text-[10px] mt-0.5">Customer ID: {order.customerId || "N/A"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-zinc-400 font-semibold block text-[10px]">Contact Number</span>
              <p className="text-slate-800 dark:text-zinc-300 font-bold flex items-center gap-1.5">
                <Phone size={12} className="text-primary" />
                {order.customer?.phone}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-zinc-400 font-semibold block text-[10px]">Email Address</span>
              <p className="text-slate-800 dark:text-zinc-300 font-bold flex items-center gap-1.5">
                <Mail size={12} className="text-blue-500" />
                {order.customer?.email || "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-zinc-400 font-semibold block text-[10px]">Loyalty Points</span>
              <p className="text-slate-800 dark:text-zinc-300 font-bold flex items-center gap-1.5">
                <Coins size={12} className="text-yellow-500" />
                {order.customer?.loyaltyPoints || 0} Points
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-zinc-400 font-semibold block text-[10px]">Lifetime Orders</span>
              <p className="text-slate-800 dark:text-zinc-300 font-bold">
                {order.customer?.previousOrdersCount || 0} orders placed
              </p>
            </div>
          </div>

          <Divider className="my-2 border-zinc-100 dark:border-zinc-800" />

          {isDelivery && (
            <div className="space-y-2">
              <span className="text-zinc-400 font-semibold block text-[10px]">Delivery Instructions</span>
              <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-150 dark:border-zinc-800 flex items-start gap-2">
                <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-slate-800 dark:text-zinc-300 font-bold leading-relaxed">
                    {order.deliveryAddress?.houseNumber}, {order.deliveryAddress?.street}, {order.deliveryAddress?.landmark}, {order.deliveryAddress?.city} - {order.deliveryAddress?.pincode}
                  </p>
                  {order.deliveryAddress?.notes && (
                    <p className="text-amber-800 dark:text-amber-400 font-semibold mt-1 italic text-[11px]">
                      Instructions: "{order.deliveryAddress.notes}"
                    </p>
                  )}
                </div>
              </div>
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
            expandIcon={({ isActive }) => <ChevronRight size={14} className={`transform transition-transform ${isActive ? "rotate-95" : ""}`} />}
            className="border-0 animate-fade-in"
          >
            {order.items?.map((item, idx) => (
              <Collapse.Panel
                header={
                  <div className="flex items-center justify-between w-full pr-4 text-xs font-bold">
                    <span className="text-slate-800 dark:text-zinc-200">{item.name} <span className="text-primary font-black">x{item.quantity}</span></span>
                    <span className="text-zinc-500 font-extrabold">{formatCurrency(item.subtotal)}</span>
                  </div>
                }
                key={idx}
                className="mb-2 bg-slate-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden"
              >
                <div className="flex gap-4 p-2 text-xs font-semibold">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 rounded-xl object-cover border border-zinc-200 shrink-0"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-zinc-400 font-semibold block">Size</span>
                        <span className="text-slate-850 dark:text-zinc-350">{item.size || "Regular"}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 font-semibold block">Base Price</span>
                        <span className="text-slate-850 dark:text-zinc-350">{formatCurrency(item.unitPrice)}</span>
                      </div>
                    </div>

                    {item.customizations?.cheeseLevel && (
                      <div>
                        <span className="text-zinc-450 text-[10px] block uppercase font-bold">Customizations</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <Tag color="orange" className="text-[10px] font-bold border-0 px-2 rounded-full m-0">{item.customizations.cheeseLevel}</Tag>
                          {item.customizations.crustType && (
                            <Tag color="cyan" className="text-[10px] font-bold border-0 px-2 rounded-full m-0">{item.customizations.crustType}</Tag>
                          )}
                        </div>
                      </div>
                    )}

                    {item.customizations?.extraToppings?.length > 0 && (
                      <div>
                        <span className="text-zinc-450 text-[10px] block uppercase font-bold">Extra Toppings</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {item.customizations.extraToppings.map((t, tIdx) => (
                            <Tag key={tIdx} color="green" className="text-[10px] font-bold border-0 px-2 rounded-full m-0">+{t}</Tag>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Collapse.Panel>
            ))}
          </Collapse>
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
        <div className="py-2 text-xs">
          <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-150 dark:border-zinc-800 mb-4 font-bold text-slate-850 dark:text-zinc-200">
            <span className="text-[9px] text-zinc-450 font-bold block uppercase mb-1">Waiting Information</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[9px] text-zinc-455 font-semibold block">Ready Timestamp</span>
                {formatDate(order.readyAt)}
              </div>
              <div>
                <span className="text-[9px] text-zinc-455 font-semibold block">Waiting Duration</span>
                {calculateWaitingDuration()}
              </div>
            </div>
          </div>

          <Timeline className="dark:text-zinc-350">
            {order.timeline?.map((t, tIdx) => (
              <Timeline.Item key={tIdx} color={t.status === "ready" ? "green" : "gray"}>
                <div className="flex flex-col gap-0.5">
                  <span className="font-extrabold capitalize text-slate-800 dark:text-zinc-200">{t.status.replace("_", " ")}</span>
                  <span className="text-[9px] text-zinc-400 font-semibold">{formatDate(t.timestamp)}</span>
                  {t.note && (
                    <span className="text-slate-500 dark:text-zinc-400 mt-1 font-semibold bg-zinc-50 dark:bg-zinc-950 p-1.5 rounded-lg border border-zinc-100 dark:border-zinc-900 inline-block w-fit">
                      {t.note}
                    </span>
                  )}
                </div>
              </Timeline.Item>
            ))}
          </Timeline>
        </div>
      )
    },
    {
      key: "delivery",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-bold py-1">
          <Bike size={14} />
          Delivery
        </span>
      ),
      children: (
        <div className="space-y-4 text-xs font-bold">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-zinc-400 font-semibold block text-[10px] uppercase">Service Mode</span>
              <Tag color={isDelivery ? "purple" : "cyan"} className="font-bold border-0 px-2 py-0.5 rounded-full mt-1 capitalize text-[10px]">
                {order.orderType}
              </Tag>
            </div>
            {isDelivery && (
              <div>
                <span className="text-zinc-400 font-semibold block text-[10px] uppercase">Rider Assignment</span>
                <Tag color={isRiderAssigned ? "blue" : "volcano"} className="font-bold border-0 px-2 py-0.5 rounded-full mt-1 text-[10px]">
                  {isRiderAssigned ? "Rider Allocated" : "Awaiting Allocation"}
                </Tag>
              </div>
            )}
          </div>

          {isDelivery && isRiderAssigned && assignedRider && (
            <>
              <Divider className="my-2 border-zinc-100 dark:border-zinc-800" />
              <div className="bg-slate-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800 p-3 rounded-2xl space-y-2">
                <span className="text-[9px] text-zinc-400 font-semibold block uppercase">Delivery Rider Details</span>
                <div className="grid grid-cols-2 gap-3 text-slate-800 dark:text-zinc-200">
                  <div>
                    <span className="text-[9px] text-zinc-455 font-semibold block">Rider Name</span>
                    {assignedRider.name}
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-455 font-semibold block">Vehicle Number</span>
                    {assignedRider.vehicleNumber}
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-455 font-semibold block">Phone</span>
                    {assignedRider.phone}
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-455 font-semibold block">Vehicle Type</span>
                    {assignedRider.vehicleType}
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-455 font-semibold block">Est. Distance</span>
                    {order.estimatedDistance || "4.5"} km
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-455 font-semibold block">Est. Time of Delivery</span>
                    {order.estimatedETA || "18"} Mins
                  </div>
                </div>
              </div>
            </>
          )}

          {isDelivery && order.deliveryAddress?.googleMapsLink && (
            <a
              href={order.deliveryAddress.googleMapsLink}
              target="_blank"
              rel="noreferrer"
              className="text-primary font-black hover:underline flex items-center gap-1 mt-2 text-[10px]"
            >
              Open Route on Google Maps <ExternalLink size={10} />
            </a>
          )}
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
        <div className="space-y-4 text-xs font-bold text-slate-800 dark:text-zinc-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-zinc-400 font-semibold block text-[10px] uppercase">Payment Method</span>
              <p className="mt-0.5 uppercase">{order.paymentMethod || "Online"}</p>
            </div>
            <div>
              <span className="text-zinc-400 font-semibold block text-[10px] uppercase">Transaction ID</span>
              <p className="mt-0.5 font-mono text-[11px] text-zinc-450 dark:text-zinc-350">TXN-{order._id?.substring(0, 10).toUpperCase() || "N/A"}</p>
            </div>
          </div>

          <Divider className="my-2 border-zinc-100 dark:border-zinc-800" />

          <div className="space-y-1.5">
            <div className="flex justify-between text-zinc-450 dark:text-zinc-400 font-semibold">
              <span>Subtotal</span>
              <span>{formatCurrency(order.grandTotal * 0.85)}</span>
            </div>
            <div className="flex justify-between text-zinc-455 dark:text-zinc-400 font-semibold">
              <span>Taxes & GST (5%)</span>
              <span>{formatCurrency(order.grandTotal * 0.05)}</span>
            </div>
            <div className="flex justify-between text-zinc-455 dark:text-zinc-400 font-semibold">
              <span>Delivery Charge</span>
              <span>{formatCurrency(order.orderType === "delivery" ? 40.00 : 0.00)}</span>
            </div>
            <Divider className="my-1.5 border-zinc-100 dark:border-zinc-800" />
            <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white">
              <span>Grand Total</span>
              <span>{formatCurrency(order.grandTotal)}</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <Modal
      title={
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 pr-8 w-full">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-primary" />
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Ready Order Details</h3>
              <p className="text-[10px] text-zinc-400 font-semibold">Monitor waiting queues and riders dispatch details</p>
            </div>
          </div>
          <div className="pr-4">
            <Tag color="success" className="font-extrabold px-2.5 py-0.5 rounded-full border-0">
              Ready
            </Tag>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={650}
      centered
      destroyOnClose
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
          <div className="flex gap-2">
            {/* Primary Action options based on rider allocation & order type */}
            {!isKitchenStaff && isDelivery && !isRiderAssigned && (
              <Button
                onClick={() => onAssignRider(order)}
                className="text-xs font-bold !border-primary/45 !text-primary bg-white dark:bg-zinc-900 hover:!bg-primary/5 hover:!border-primary hover:!text-primary-hover active:scale-95 transition-all cursor-pointer rounded-full px-4 py-2 shadow-sm flex items-center gap-1"
              >
                <UserCheck size={12} className="text-primary" />
                Assign Rider
              </Button>
            )}

            {!isKitchenStaff && (order.orderType === "pickup" || isRiderAssigned) && (
              <Button
                onClick={() => onConfirmPickup(order)}
                className="text-xs font-bold !bg-primary hover:!bg-primary-hover border-0 !text-white rounded-full font-bold px-4 py-2 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer flex items-center gap-1"
              >
                <CheckCircle2 size={12} />
                Mark Picked Up
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => onPrint(order)}
              className="text-xs font-bold border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-full px-4 py-2 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
            >
              <Printer size={12} className="text-primary" />
              Receipt
            </Button>
            
            <Button
              key="close"
              onClick={onClose}
              className="text-xs font-bold border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-full px-4 py-2 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>
      }
    >
      <Tabs defaultActiveKey="details" items={tabItems} className="py-2 ready-details-tabs animate-fade-in" />
    </Modal>
  );
}
