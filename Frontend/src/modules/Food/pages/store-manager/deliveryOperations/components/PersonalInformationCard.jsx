import React from "react";
import { User, Smartphone, Star, Calendar, Mail, MapPin, Bike, Hash } from "lucide-react";

// Real signup data of the rider (no documents): contact, address, vehicle, joining date and rating.
function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-2.5 py-2 first:pt-0 last:pb-0">
      <Icon size={13} className="text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <span className="text-[8px] text-slate-400 uppercase tracking-widest block font-black">{label}</span>
        <div className="font-extrabold text-[12px] leading-snug text-slate-900 dark:text-white mt-0.5 break-words">{children}</div>
      </div>
    </div>
  );
}

export default function PersonalInformationCard({ rider }) {
  if (!rider) return null;

  const address = [rider.address, rider.city, rider.state].filter(Boolean).join(", ");
  const vehicle = [rider.vehicleType, rider.vehicleName].filter(Boolean).join(" · ");
  const joined = rider.joiningDate ? new Date(rider.joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "";
  const rated = Number(rider.ratingCount) > 0 || Number(rider.rating) > 0;

  return (
    <div className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-slate-200/70 dark:border-zinc-850 text-xs font-bold text-slate-700 dark:text-zinc-300 h-full shadow-sm">
      <div className="flex items-center gap-1.5 border-b border-slate-200/60 dark:border-zinc-800/80 pb-2 mb-3">
        <User size={14} className="text-[var(--primary)]" />
        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Personal Profile</h4>
      </div>

      <div className="flex items-center gap-3 mb-3">
        {rider.profilePhoto ? (
          <img src={rider.profilePhoto} alt={rider.name} className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-zinc-800" />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center font-black text-lg text-slate-500">
            {String(rider.name || "?").trim().charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-black text-base text-slate-900 dark:text-white leading-tight truncate">{rider.name}</p>
          {rated ? (
            <p className="flex items-center gap-1 text-amber-500 font-black text-[11px] mt-0.5">
              <Star size={11} fill="currentColor" /> {Number(rider.rating).toFixed(1)}
              <span className="text-slate-400 font-bold">({rider.ratingCount || 0} ratings)</span>
            </p>
          ) : (
            <p className="text-slate-400 font-semibold text-[11px] mt-0.5">No ratings yet</p>
          )}
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-zinc-850">
        <Row icon={Smartphone} label="Mobile">
          <a href={`tel:${rider.mobile}`} className="hover:underline">{rider.mobile}</a>
        </Row>
        <Row icon={Mail} label="Email">{rider.email || <span className="text-slate-400 font-semibold">Not given</span>}</Row>
        <Row icon={MapPin} label="Address">{address || <span className="text-slate-400 font-semibold">Not given</span>}</Row>
        <Row icon={Bike} label="Vehicle">{vehicle || <span className="text-slate-400 font-semibold">Not given</span>}</Row>
        <Row icon={Hash} label="Vehicle number">
          {rider.vehicleNumber ? <span className="font-mono tracking-wide">{rider.vehicleNumber}</span> : <span className="text-slate-400 font-semibold">Not given</span>}
        </Row>
        <Row icon={Calendar} label="Joined">{joined || <span className="text-slate-400 font-semibold">Not known</span>}</Row>
      </div>
    </div>
  );
}
