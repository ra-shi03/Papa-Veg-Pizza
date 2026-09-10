import React, { useState } from "react";
import { Modal, Tabs, Collapse, Tag, Divider, Button, Timeline, Input } from "antd";
import {
  ClipboardList,
  User,
  MapPin,
  Pizza,
  History,
  UserCheck,
  ExternalLink,
  Phone,
  Mail,
  Coins,
  ChevronRight,
  Pause,
  Play,
  CheckCircle2,
  Clock,
  AlertTriangle,
  HelpCircle
} from "lucide-react";

export default function ActiveOrderDetailsModal({
  visible,
  onClose,
  order,
  role,
  onPause,
  onAssignStaff,
  onChangePriority,
  onMarkReady
}) {
  if (!order) return null;

  const isAlreadyPaused = order.isPaused || false;

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
    let color = "blue";
    if (priority?.toLowerCase() === "urgent") color = "volcano";
    if (priority?.toLowerCase() === "vip") color = "gold";
    return (
      <Tag color={color} className="font-extrabold capitalize px-2.5 py-0.5 rounded-full border-0">
        {priority || "Normal"}
      </Tag>
    );
  };

  // Render status/stage tag
  const renderStageTag = (status) => {
    switch (status) {
      case "confirmed":
        return <Tag color="blue" className="font-extrabold px-2.5 py-0.5 rounded-full border-0">Confirmed (Awaiting Prep)</Tag>;
      case "preparing":
        return <Tag color="processing" className="font-extrabold px-2.5 py-0.5 rounded-full border-0">Preparing (Pizza Line)</Tag>;
      case "baking":
        return <Tag color="warning" className="font-extrabold px-2.5 py-0.5 rounded-full border-0">Baking (Oven)</Tag>;
      case "packaging":
        return <Tag color="purple" className="font-extrabold px-2.5 py-0.5 rounded-full border-0">Packaging (Wrapping)</Tag>;
      case "ready":
        return <Tag color="success" className="font-extrabold px-2.5 py-0.5 rounded-full border-0">Ready for Dispatch</Tag>;
      default:
        return <Tag color="default" className="font-extrabold capitalize px-2.5 py-0.5 rounded-full border-0">{status}</Tag>;
    }
  };

  // Check role-based permission
  const isManagerOrSupervisor = role === "store_manager" || role === "kitchen_supervisor";
  const isKitchenStaff = role === "kitchen_staff";
  const isPackagingStaff = role === "packaging_staff";

  // Tab items definition
  const tabItems = [
    {
      key: "details",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-bold py-1">
          <ClipboardList size={14} />
          Details
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
              <p className="text-zinc-400 font-semibold mb-0.5">Kitchen Stage</p>
              <div className="mt-0.5">{renderStageTag(order.status)}</div>
            </div>
            <div>
              <p className="text-zinc-400 font-semibold mb-0.5">Order Type</p>
              <Tag color="purple" className="font-bold border-0 px-2 py-0.5 rounded-full mt-0.5 capitalize">{order.orderType}</Tag>
            </div>
            <div>
              <p className="text-zinc-400 font-semibold mb-0.5">Priority</p>
              <div className="mt-0.5">{renderPriorityTag(order.priority)}</div>
            </div>
            <div>
              <p className="text-zinc-400 font-semibold mb-0.5">Order Source</p>
              <p className="text-slate-800 dark:text-zinc-300 font-bold mt-0.5">{order.orderSource || "Website"}</p>
            </div>
            <div>
              <p className="text-zinc-400 font-semibold mb-0.5">Received At</p>
              <p className="text-slate-800 dark:text-zinc-300 font-bold mt-0.5">{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-zinc-400 font-semibold mb-0.5">Expected Ready At</p>
              <p className="text-slate-900 dark:text-white font-extrabold mt-0.5 flex items-center gap-1">
                <Clock size={12} className="text-primary" />
                {formatDate(order.expectedReadyAt)}
              </p>
            </div>
            <div>
              <p className="text-zinc-400 font-semibold mb-0.5">Total Amount</p>
              <p className="text-slate-900 dark:text-white font-extrabold text-sm mt-0.5">{formatCurrency(order.grandTotal)}</p>
            </div>
          </div>

          {order.kitchenNote && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl">
              <h5 className="font-extrabold text-amber-800 dark:text-amber-400 mb-1 text-[11px] uppercase tracking-wider">Kitchen Instructions:</h5>
              <p className="text-amber-900 dark:text-amber-300 font-medium text-xs leading-relaxed">{order.kitchenNote}</p>
            </div>
          )}

          {isAlreadyPaused && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-950/40 rounded-xl flex items-start gap-2">
              <AlertTriangle className="text-red-500 mt-0.5" size={14} />
              <div>
                <h5 className="font-extrabold text-red-800 dark:text-red-400 mb-0.5 text-[11px] uppercase tracking-wider">Preparation Paused</h5>
                <p className="text-red-900 dark:text-red-300 font-medium text-xs">{order.pauseReason || "No reason specified"}</p>
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
            className="border-0"
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
                <div className="flex gap-4 p-2 text-xs">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover border border-zinc-200 shrink-0"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-zinc-400 font-semibold block">Size</span>
                        <span className="text-slate-800 dark:text-zinc-300 font-bold">{item.size || "Regular"}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 font-semibold block">Crust</span>
                        <span className="text-slate-800 dark:text-zinc-300 font-bold">{item.customizations?.crustType || "Classic"}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 font-semibold block">Cheese</span>
                        <span className="text-slate-800 dark:text-zinc-300 font-bold">{item.customizations?.cheeseLevel || "Normal"}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 font-semibold block">Base Price</span>
                        <span className="text-slate-800 dark:text-zinc-300 font-bold">{formatCurrency(item.unitPrice)}</span>
                      </div>
                    </div>

                    {item.customizations?.extraToppings?.length > 0 && (
                      <div>
                        <span className="text-zinc-400 font-bold text-[10px] uppercase block mb-1">Toppings added</span>
                        <div className="flex flex-wrap gap-1">
                          {item.customizations.extraToppings.map((t, tIdx) => (
                            <Tag key={tIdx} color="green" className="m-0 text-[10px] font-bold border-0 rounded-full px-2">
                              +{t}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.customizations?.removeIngredients?.length > 0 && (
                      <div>
                        <span className="text-zinc-400 font-bold text-[10px] uppercase block mb-1">Ingredients removed</span>
                        <div className="flex flex-wrap gap-1">
                          {item.customizations.removeIngredients.map((r, rIdx) => (
                            <Tag key={rIdx} color="red" className="m-0 text-[10px] font-bold border-0 rounded-full px-2">
                              No {r}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.customizations?.specialInstructions && (
                      <div className="bg-amber-50/50 dark:bg-amber-950/10 p-2 rounded-lg border border-amber-100 dark:border-amber-900/10">
                        <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 block uppercase">Special Instructions</span>
                        <p className="text-[10px] text-amber-900 dark:text-amber-300 font-semibold mt-0.5">{item.customizations.specialInstructions}</p>
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
      key: "customer",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-bold py-1">
          <User size={14} />
          Customer
        </span>
      ),
      children: (
        <div className="space-y-4 text-xs">
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
              <span className="text-zinc-400 font-semibold block">Contact Number</span>
              <p className="text-slate-800 dark:text-zinc-300 font-bold flex items-center gap-1.5">
                <Phone size={12} className="text-primary" />
                {order.customer?.phone}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-zinc-400 font-semibold block">Email Address</span>
              <p className="text-slate-800 dark:text-zinc-300 font-bold flex items-center gap-1.5">
                <Mail size={12} className="text-blue-500" />
                {order.customer?.email || "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-zinc-400 font-semibold block">Loyalty Points</span>
              <p className="text-slate-800 dark:text-zinc-300 font-bold flex items-center gap-1.5">
                <Coins size={12} className="text-yellow-500" />
                {order.customer?.loyaltyPoints || 0} Points
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-zinc-400 font-semibold block">Customer Orders Lifetime</span>
              <p className="text-slate-800 dark:text-zinc-300 font-bold">
                {order.customer?.previousOrdersCount || 0} orders placed
              </p>
            </div>
          </div>

          <Divider className="my-2 border-zinc-100 dark:border-zinc-800" />

          <div className="space-y-2">
            <span className="text-zinc-400 font-semibold block">Delivery Location</span>
            <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-150 dark:border-zinc-800 flex items-start gap-2">
              <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-slate-800 dark:text-zinc-300 font-bold leading-relaxed">
                  {order.deliveryAddress?.houseNumber}, {order.deliveryAddress?.street}, {order.deliveryAddress?.landmark}, {order.deliveryAddress?.city} - {order.deliveryAddress?.pincode}
                </p>
                {order.deliveryAddress?.notes && (
                  <p className="text-amber-800 dark:text-amber-400 font-semibold mt-1 italic text-[11px]">
                    Note: "{order.deliveryAddress.notes}"
                  </p>
                )}
                {order.deliveryAddress?.googleMapsLink && (
                  <a
                    href={order.deliveryAddress.googleMapsLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary font-bold hover:underline flex items-center gap-1 mt-2 text-[10px]"
                  >
                    Open on Google Maps <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      key: "staff",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-bold py-1">
          <UserCheck size={14} />
          Assigned Staff
        </span>
      ),
      children: (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3">
            {/* Pizza Chef */}
            <div className="bg-slate-50 dark:bg-zinc-950 p-3 border border-zinc-150 dark:border-zinc-800 rounded-2xl text-center space-y-1.5 flex flex-col justify-between">
              <div>
                <span className="text-zinc-450 dark:text-zinc-400 font-bold block text-[10px] uppercase">Pizza Chef</span>
                <p className="text-slate-800 dark:text-zinc-200 font-extrabold mt-1">
                  {order.assignedStaff?.pizza_chef?.name || "Not Assigned"}
                </p>
              </div>
              {isManagerOrSupervisor && (
                <Button
                  onClick={() => onAssignStaff(order)}
                  size="small"
                  className="rounded-full text-[10px] font-bold border border-zinc-200 hover:border-primary hover:text-primary active:scale-95 transition-all mt-2 w-full"
                >
                  Change
                </Button>
              )}
            </div>

            {/* Baking Chef */}
            <div className="bg-slate-50 dark:bg-zinc-950 p-3 border border-zinc-150 dark:border-zinc-800 rounded-2xl text-center space-y-1.5 flex flex-col justify-between">
              <div>
                <span className="text-zinc-450 dark:text-zinc-400 font-bold block text-[10px] uppercase">Baking Chef</span>
                <p className="text-slate-800 dark:text-zinc-200 font-extrabold mt-1">
                  {order.assignedStaff?.baking_chef?.name || "Not Assigned"}
                </p>
              </div>
              {isManagerOrSupervisor && (
                <Button
                  onClick={() => onAssignStaff(order)}
                  size="small"
                  className="rounded-full text-[10px] font-bold border border-zinc-200 hover:border-primary hover:text-primary active:scale-95 transition-all mt-2 w-full"
                >
                  Change
                </Button>
              )}
            </div>

            {/* Packaging Staff */}
            <div className="bg-slate-50 dark:bg-zinc-950 p-3 border border-zinc-150 dark:border-zinc-800 rounded-2xl text-center space-y-1.5 flex flex-col justify-between">
              <div>
                <span className="text-zinc-450 dark:text-zinc-400 font-bold block text-[10px] uppercase">Packaging Staff</span>
                <p className="text-slate-800 dark:text-zinc-200 font-extrabold mt-1">
                  {order.assignedStaff?.packaging_staff?.name || "Not Assigned"}
                </p>
              </div>
              {isManagerOrSupervisor && (
                <Button
                  onClick={() => onAssignStaff(order)}
                  size="small"
                  className="rounded-full text-[10px] font-bold border border-zinc-200 hover:border-primary hover:text-primary active:scale-95 transition-all mt-2 w-full"
                >
                  Change
                </Button>
              )}
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
        <div className="py-2 text-xs">
          <Timeline className="dark:text-zinc-300">
            {order.timeline?.map((t, tIdx) => (
              <Timeline.Item
                key={tIdx}
                color={
                  t.status === "ready" 
                    ? "green" 
                    : t.status === "packaging" 
                    ? "purple" 
                    : t.status === "baking" 
                    ? "orange" 
                    : t.status === "preparing" 
                    ? "blue" 
                    : "gray"
                }
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-extrabold capitalize text-slate-800 dark:text-zinc-200">
                    {t.status.replace("_", " ")}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {formatDate(t.timestamp)}
                  </span>
                  {t.note && (
                    <span className="text-slate-500 dark:text-zinc-400 mt-0.5 font-semibold bg-zinc-50 dark:bg-zinc-950 p-1.5 rounded-lg border border-zinc-100 dark:border-zinc-900 inline-block w-fit">
                      {t.note}
                    </span>
                  )}
                </div>
              </Timeline.Item>
            ))}
          </Timeline>
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
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Active Order Details</h3>
              <p className="text-[10px] text-zinc-400 font-semibold">Monitor real-time kitchen status and details</p>
            </div>
          </div>
          <div className="pr-4">
            {renderStageTag(order.status)}
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={680}
      centered
      destroyOnClose
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
          <div className="flex gap-2">
            {/* Action buttons based on Role & Permissions */}
            {isManagerOrSupervisor && (
              <>
                <Button
                  onClick={() => onPause(order)}
                  className={`text-xs font-bold border rounded-full px-4 py-2 shadow-sm active:scale-95 transition-all cursor-pointer flex items-center gap-1 ${
                    isAlreadyPaused
                      ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                  }`}
                >
                  {isAlreadyPaused ? <Play size={12} /> : <Pause size={12} />}
                  {isAlreadyPaused ? "Resume Prep" : "Pause Prep"}
                </Button>
                
                <Button
                  onClick={() => onAssignStaff(order)}
                  className="text-xs font-bold !border-primary/45 !text-primary bg-white dark:bg-zinc-900 hover:!bg-primary/5 hover:!border-primary hover:!text-primary-hover active:scale-95 transition-all cursor-pointer rounded-full px-4 py-2 shadow-sm flex items-center gap-1"
                >
                  <UserCheck size={12} className="text-primary" />
                  Assign Staff
                </Button>

                <Button
                  onClick={() => onChangePriority(order)}
                  className="text-xs font-bold !border-primary/45 !text-primary bg-white dark:bg-zinc-900 hover:!bg-primary/5 hover:!border-primary hover:!text-primary-hover active:scale-95 transition-all cursor-pointer rounded-full px-4 py-2 shadow-sm"
                >
                  Priority
                </Button>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              key="close"
              onClick={onClose}
              className="text-xs font-bold border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-full px-4 py-2 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
            >
              Close
            </Button>
            
            {/* Mark Ready: Supervisors, Managers, and Packaging staff can mark ready */}
            {(isManagerOrSupervisor || isPackagingStaff) && (
              <Button
                type="primary"
                onClick={() => onMarkReady(order)}
                className="!bg-primary hover:!bg-primary-hover border-0 !text-white rounded-full font-bold px-5 py-2 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer text-xs flex items-center gap-1"
              >
                <CheckCircle2 size={12} />
                Mark Ready
              </Button>
            )}
          </div>
        </div>
      }
    >
      <Tabs defaultActiveKey="details" items={tabItems} className="py-2 active-details-tabs" />
    </Modal>
  );
}
