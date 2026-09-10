import React from "react";
import { Modal } from "antd";
import { Phone, Navigation, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PersonalInformationCard from "./PersonalInformationCard";
import CurrentStatusCard from "./CurrentStatusCard";
import PerformanceCard from "./PerformanceCard";

export default function RiderDetailsModal({ visible, onClose, riderId, rider, isLoading }) {
  const navigate = useNavigate();

  const handleTrackRider = () => {
    if (riderId) {
      navigate(`/store-operations/delivery/tracking?riderId=${riderId}`);
      onClose();
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] animate-ping" />
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Delivery Partner Dashboard</h3>
            <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-555 mt-0.5">
              Live operational standing and historic delivery stats
            </p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={780}
      centered
      footer={
        rider ? (
          <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-zinc-800">
            <a
              href={`tel:${rider.mobile}`}
              style={{ backgroundColor: "var(--primary)" }}
              className="px-4 py-2 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer hover:opacity-90"
            >
              <Phone size={12} />
              <span>Call Rider</span>
            </a>
            <button
              onClick={handleTrackRider}
              className="px-4 py-2 border border-slate-250 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-700 dark:text-zinc-300 font-extrabold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Navigation size={12} />
              <span>View Tracking</span>
            </button>
          </div>
        ) : null
      }
    >
      <div className="py-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-2.5xl border border-slate-100 dark:border-zinc-850 h-[220px] animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-1/2" />
                <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-full" />
                <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-5/6" />
              </div>
            ))}
          </div>
        ) : !rider ? (
          <div className="text-center py-6 text-slate-400 font-bold">
            Rider details not found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            <div className="w-full">
              <PersonalInformationCard rider={rider} />
            </div>
            <div className="w-full">
              <CurrentStatusCard rider={rider} />
            </div>
            <div className="w-full">
              <PerformanceCard rider={rider} />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
