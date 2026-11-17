import React, { useState } from "react";
import { Gift, Search, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { lookupRewardCode, useConfirmRewardCode, useCancelRewardCode, rewardCodeError } from "./hooks/useRewardCodes";

const fmt = (d) => (d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-");

const STATUS_TEXT = {
  PENDING: { label: "Ready to hand over", cls: "text-emerald-600" },
  REDEEMED: { label: "Already used", cls: "text-zinc-500" },
  CANCELLED: { label: "Cancelled", cls: "text-red-600" },
  EXPIRED: { label: "Expired", cls: "text-red-600" },
};

/** Store manager: the customer shows a 6-digit reward code; check it, hand over the free item, confirm. */
export default function RewardCodes() {
  const [code, setCode] = useState("");
  const [found, setFound] = useState(null);
  const [looking, setLooking] = useState(false);
  const [reason, setReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const confirm = useConfirmRewardCode();
  const cancel = useCancelRewardCode();

  const search = async (e) => {
    e?.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setLooking(true);
    try {
      setFound(await lookupRewardCode(code));
      setCancelling(false);
      setReason("");
    } catch (err) {
      setFound(null);
      toast.error(rewardCodeError(err));
    } finally {
      setLooking(false);
    }
  };

  const done = async () => {
    try {
      setFound(await confirm.mutateAsync(found.code).then((r) => ({ ...found, ...r })));
    } catch (_) { /* shown by the mutation */ }
  };

  const doCancel = async () => {
    if (!reason.trim()) {
      toast.error("Give a reason for cancelling");
      return;
    }
    try {
      const r = await cancel.mutateAsync({ code: found.code, reason: reason.trim() });
      setFound({ ...found, ...r });
      setCancelling(false);
    } catch (_) { /* shown by the mutation */ }
  };

  const status = found ? STATUS_TEXT[found.status] || { label: found.status, cls: "text-zinc-500" } : null;

  return (
    <div className="max-w-xl mx-auto p-4 space-y-5">
      <div className="flex items-center gap-3">
        <Gift className="text-primary" size={22} />
        <div>
          <h1 className="text-lg font-black text-slate-900 dark:text-white">Reward Codes</h1>
          <p className="text-xs text-zinc-500">A customer claimed a free item with their points. Enter the code they show you, hand over the item, then confirm.</p>
        </div>
      </div>

      <form onSubmit={search} className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          placeholder="6-digit code"
          className="flex-1 h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 text-lg font-black tracking-widest bg-white dark:bg-zinc-900"
        />
        <button type="submit" disabled={looking} className="h-11 px-5 rounded-xl bg-primary text-white font-bold text-sm flex items-center gap-1.5 border-0 cursor-pointer disabled:opacity-60">
          <Search size={15} /> {looking ? "Checking..." : "Check"}
        </button>
      </form>

      {found && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase text-zinc-400">Reward</p>
              <p className="text-base font-black text-slate-900 dark:text-white">{found.product?.name}</p>
              <p className="text-xs text-zinc-500">{[found.product?.size, found.product?.crust].filter(Boolean).join(" · ")}</p>
            </div>
            <span className={`text-xs font-black ${status.cls}`}>{status.label}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><p className="text-[10px] font-bold uppercase text-zinc-400">Customer</p><p className="font-bold">{found.customer?.name || "-"}</p><p className="text-zinc-500">{found.customer?.phone}</p></div>
            <div><p className="text-[10px] font-bold uppercase text-zinc-400">Points used</p><p className="font-bold">{found.points}</p></div>
            <div><p className="text-[10px] font-bold uppercase text-zinc-400">Code made</p><p>{fmt(found.createdAt)}</p></div>
            <div><p className="text-[10px] font-bold uppercase text-zinc-400">{found.status === "REDEEMED" ? "Handed over" : "Valid until"}</p><p>{fmt(found.status === "REDEEMED" ? found.redeemedAt : found.expiresAt)}</p></div>
          </div>

          {found.status === "PENDING" && !cancelling && (
            <div className="flex gap-2 pt-1">
              <button onClick={done} disabled={confirm.isPending} className="flex-1 h-11 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-1.5 border-0 cursor-pointer disabled:opacity-60">
                <CheckCircle2 size={16} /> {confirm.isPending ? "Confirming..." : "Handed over - confirm"}
              </button>
              <button onClick={() => setCancelling(true)} className="h-11 px-4 rounded-xl border border-red-300 text-red-600 font-bold text-sm bg-transparent cursor-pointer flex items-center gap-1.5">
                <XCircle size={16} /> Cancel code
              </button>
            </div>
          )}

          {found.status === "PENDING" && cancelling && (
            <div className="space-y-2 pt-1">
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this being cancelled? (e.g. item not available today)" maxLength={200} className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 text-xs bg-white dark:bg-zinc-900" />
              <div className="flex gap-2">
                <button onClick={doCancel} disabled={cancel.isPending} className="flex-1 h-10 rounded-xl bg-red-600 text-white font-bold text-xs border-0 cursor-pointer disabled:opacity-60">{cancel.isPending ? "Cancelling..." : "Cancel code and give points back"}</button>
                <button onClick={() => setCancelling(false)} className="h-10 px-4 rounded-xl border border-zinc-300 text-xs font-bold bg-transparent cursor-pointer">Back</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
