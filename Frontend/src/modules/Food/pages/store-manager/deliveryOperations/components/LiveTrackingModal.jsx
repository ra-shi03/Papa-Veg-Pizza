import React from "react";
import { Modal } from "antd";
import { Loader2, Navigation, MapPin } from "lucide-react";
import CustomerCard from "./CustomerCard";
import RiderCard from "./RiderCard";
import OrderCard from "./OrderCard";
import DeliveryTimeline from "./DeliveryTimeline";
import TrackingMap from "./TrackingMap";

export default function LiveTrackingModal({ visible, onClose, orderId, trackingData, isLoading }) {
  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3 select-none">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Live Delivery Tracking</span>
              <span className="text-[10px] text-slate-400 font-bold border border-slate-200 dark:border-zinc-800 px-1.5 py-0.5 rounded-md">
                {orderId}
              </span>
            </h3>
            <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-555 mt-0.5">
              Real-time telemetry and milestone tracker.
            </p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={1000}
      centered
      footer={null}
      destroyOnClose={true}
    >
      <div className="py-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
            <span className="text-xs font-bold text-slate-400 dark:text-zinc-550">
              Retrieving live telemetry data...
            </span>
          </div>
        ) : !trackingData ? (
          <div className="text-center py-12 text-slate-400 font-bold text-xs">
            Unable to fetch tracking data for this order. Please try again.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 items-start">
            {/* Left Panel: Info Cards & Timeline (40%) */}
            <div className="lg:col-span-4 space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
              <CustomerCard customer={trackingData.customer} />
              <RiderCard rider={trackingData.rider} />
              <OrderCard order={trackingData.order} />
              <DeliveryTimeline
                timeline={trackingData.timeline}
                currentStatus={trackingData.order?.status}
              />
            </div>

            {/* Right Panel: Leaflet Map (60%) */}
            <div className="lg:col-span-6 w-full h-full min-h-[350px] lg:min-h-[450px]">
              <TrackingMap
                store={trackingData.store}
                customer={trackingData.customer}
                rider={trackingData.rider}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
