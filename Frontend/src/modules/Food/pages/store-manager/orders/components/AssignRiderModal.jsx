import React, { useState, useEffect } from "react";
import { Modal, Select, Input, Button, Rate } from "antd";
import { UserPlus, Bike, AlertCircle, Compass, Clock, Map } from "lucide-react";
import { useAvailableRiders, useAssignRider } from "../hooks/useReadyOrders";
import { toast } from "sonner";

export default function AssignRiderModal({ visible, onClose, order }) {
  const [riderId, setRiderId] = useState(null);
  const [searchRider, setSearchRider] = useState("");
  const [notes, setNotes] = useState("");

  const { data: riders = [], isLoading: loadingRiders } = useAvailableRiders(searchRider);
  const assignRiderMutation = useAssignRider();

  // Reset states when visible
  useEffect(() => {
    if (order) {
      setRiderId(null);
      setSearchRider("");
      setNotes("");
    }
  }, [order, visible]);

  if (!order) return null;

  // Consistent auto-calculations for distance & ETA
  const calculateDistance = () => {
    if (!order.deliveryAddress || !order.deliveryAddress.pincode) return 4.5;
    const pinDigits = parseInt(order.deliveryAddress.pincode) || 452001;
    return Number((1.5 + (pinDigits % 7) * 0.8).toFixed(1));
  };

  const calculateETA = (distance) => {
    return Math.round(distance * 3) + 6; // ~3 mins per km + 6 mins buffer
  };

  const distance = calculateDistance();
  const eta = calculateETA(distance);

  const handleAssign = async () => {
    if (!riderId) {
      toast.error("Please select a delivery rider");
      return;
    }

    try {
      await assignRiderMutation.mutateAsync({
        orderId: order._id,
        deliveryPartnerId: riderId,
        estimatedDistance: distance,
        estimatedETA: eta,
        notes
      });
      onClose();
    } catch (e) {
      // Handled by mutation toast
    }
  };

  const renderRiderOption = (rider) => {
    return (
      <Select.Option key={rider._id} value={rider._id}>
        <div className="flex items-center justify-between w-full py-1 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-800 dark:text-zinc-200 font-extrabold">{rider.name}</span>
            <span className="text-[9px] text-zinc-400">({rider.employeeId})</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-zinc-450 dark:text-zinc-400 capitalize">
              {rider.vehicleType} | Rating: {rider.rating}★
            </span>
            <span className="text-[9px] bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 px-1.5 py-0.5 rounded-full border border-green-200 dark:border-green-800/30">
              Active: {rider.currentDeliveries}
            </span>
          </div>
        </div>
      </Select.Option>
    );
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 pr-8">
          <UserPlus size={18} className="text-primary" />
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Assign Delivery Rider</h3>
            <p className="text-[10px] text-zinc-400 font-semibold">Dispatch Order {order.orderNumber} with local riders</p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={480}
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
          loading={assignRiderMutation.isPending}
          onClick={handleAssign}
          disabled={!riderId}
          className="!bg-primary hover:!bg-primary-hover border-0 !text-white rounded-full font-bold px-5 py-2 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer text-xs"
        >
          Assign Rider
        </Button>
      ]}
    >
      <div className="py-4 space-y-4">
        
        {/* Auto Calculations Summary */}
        <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-150 dark:border-zinc-800/40 text-xs font-bold">
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-primary" />
            <div>
              <span className="text-[9px] text-zinc-400 uppercase block font-semibold">Est. Distance</span>
              <span className="text-slate-855 dark:text-zinc-200">{distance} km</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-blue-500" />
            <div>
              <span className="text-[9px] text-zinc-400 uppercase block font-semibold">Est. Delivery ETA</span>
              <span className="text-slate-855 dark:text-zinc-200">{eta} Mins</span>
            </div>
          </div>
        </div>

        {/* Available Riders Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Bike size={14} className="text-primary" />
            Select Available Rider
          </label>
          <Select
            showSearch
            placeholder="Search available riders..."
            value={riderId}
            onSearch={(val) => setSearchRider(val)}
            onChange={(val) => setRiderId(val)}
            className="w-full h-10 rounded-xl"
            loading={loadingRiders}
            dropdownMatchSelectWidth={false}
            filterOption={false}
          >
            {riders.map(renderRiderOption)}
          </Select>
        </div>

        {/* Delivery notes */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
            Delivery Notes (Optional)
          </label>
          <Input.TextArea
            placeholder="Add specific instructions for the rider..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-medium"
          />
        </div>
      </div>
    </Modal>
  );
}
