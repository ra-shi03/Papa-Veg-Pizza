import React from "react";
import { Modal } from "antd";
import { Navigation } from "lucide-react";
import OrderDetailsCard from "./OrderDetailsCard";
import AvailableRidersTable from "./AvailableRidersTable";

export default function AssignRiderModal({
  visible,
  onClose,
  order,
  riders = [],
  isLoadingRiders,
  onSelectRider
}) {
  if (!order) return null;

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <Navigation size={18} className="text-[var(--primary)] animate-pulse" />
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Select Delivery Partner</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 mt-0.5">
              Assign an available online rider to start order delivery
            </p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      centered
      footer={null} // Actions happen inside the riders list
    >
      <div className="py-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column: Order details (col-span 4) */}
        <div className="lg:col-span-4 w-full">
          <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-2">
            Selected Order Info
          </span>
          <OrderDetailsCard order={order} />
        </div>

        {/* Right Column: Available riders (col-span 8) */}
        <div className="lg:col-span-8 w-full space-y-2">
          <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
            Online & Available Riders
          </span>
          <AvailableRidersTable
            riders={riders}
            isLoading={isLoadingRiders}
            onSelectRider={onSelectRider}
          />
        </div>

      </div>
    </Modal>
  );
}
