import React, { useState, useEffect } from "react";
import { Modal, Input, Button, DatePicker } from "antd";
import { CheckCircle2, ShieldCheck, Clock, AlertTriangle } from "lucide-react";
import { useConfirmPickup } from "../hooks/useReadyOrders";
import dayjs from "dayjs";

export default function ConfirmPickupModal({ visible, onClose, order }) {
  const [pickupTime, setPickupTime] = useState(null);
  const [notes, setNotes] = useState("");

  const confirmPickupMutation = useConfirmPickup();

  useEffect(() => {
    if (order) {
      setPickupTime(dayjs());
      setNotes("");
    }
  }, [order, visible]);

  if (!order) return null;

  // Retrieve assigned rider info (simulate lookup in local storage mock riders if not fully populated)
  const assignedRider = order.deliveryPartner
    || (order.deliveryPartnerId
      ? (JSON.parse(localStorage.getItem("pvp_riders")) || []).find(r => r._id === order.deliveryPartnerId)
      : null);

  // collected at the store: no rider, no code
  const isPickup = order.orderType === "pickup" || order.isPickup === true;

  const handleConfirm = async () => {
    try {
      await confirmPickupMutation.mutateAsync({
        orderId: order._id,
        pickup: isPickup,
        pickedUpAt: pickupTime ? pickupTime.toISOString() : new Date().toISOString(),
        notes
      });
      onClose();
    } catch (e) {
      // Handled by mutation toast
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 pr-8">
          <ShieldCheck size={18} className="text-primary" />
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">{isPickup ? "Hand Over to Customer" : "Confirm Order Pickup"}</h3>
            <p className="text-[10px] text-zinc-400 font-semibold">{isPickup ? "The customer collects this order at the store" : "Check the rider and the bill photo before the order leaves"}</p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={450}
      centered
      destroyOnClose
      footer={[
        <Button
          key="cancel"
          onClick={onClose}
          className="text-xs font-bold border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-full px-4 py-2 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
        >
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={confirmPickupMutation.isPending}
          onClick={handleConfirm}
          className="!bg-primary hover:!bg-primary-hover border-0 !text-white rounded-full font-bold px-5 py-2 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer text-xs"
        >
          {isPickup ? "Hand Over" : "Confirm Pickup"}
        </Button>
      ]}
    >
      <div className="py-4 space-y-4">
        
        {/* Warning Banner */}
        {!isPickup && (<>
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-3 rounded-2xl flex gap-2.5 items-start">
          <AlertTriangle className="text-amber-600 mt-0.5 shrink-0" size={16} />
          <div>
            <p className="text-xs font-bold text-amber-800 dark:text-amber-400">Rider Handover Verification</p>
            <p className="text-[10px] text-amber-700/80 dark:text-amber-500 font-semibold mt-0.5">
              Hand the order over only to the rider shown below. The rider must have uploaded the bill photo in the delivery app first.
            </p>
          </div>
        </div>

        {/* Assigned Rider Info */}
        {assignedRider ? (
          <div className="bg-slate-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 p-3 rounded-2xl space-y-2">
            <span className="text-[9px] text-zinc-400 font-bold block uppercase">Assigned Delivery Rider</span>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-800 dark:text-zinc-200">
              <div>
                <span className="text-[9px] text-zinc-450 block font-semibold">Name</span>
                {assignedRider.name}
              </div>
              <div>
                <span className="text-[9px] text-zinc-455 block font-semibold">Vehicle Number</span>
                {assignedRider.vehicleNumber}
              </div>
              <div>
                <span className="text-[9px] text-zinc-455 block font-semibold">Phone Number</span>
                {assignedRider.phone}
              </div>
              <div>
                <span className="text-[9px] text-zinc-455 block font-semibold">Vehicle</span>
                {assignedRider.vehicleName || assignedRider.vehicleType || "-"}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 text-red-700 rounded-2xl text-xs font-bold text-center">
            No rider assigned to this order yet. Please assign a rider first.
          </div>
        )}

        </>)}
        {/* Pickup Time DatePicker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Clock size={14} className="text-primary" />
            Pickup Timestamp
          </label>
          <DatePicker
            showTime
            value={pickupTime}
            onChange={(val) => setPickupTime(val)}
            className="w-full h-10 rounded-xl"
            format="YYYY-MM-DD HH:mm:ss"
          />
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
            Handover Comments (Optional)
          </label>
          <Input.TextArea
            placeholder="Add comments on package condition, rider swap, etc..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="rounded-xl border-zinc-200 dark:border-zinc-800 text-xs"
          />
        </div>
      </div>
    </Modal>
  );
}
