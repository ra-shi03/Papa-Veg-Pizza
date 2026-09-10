import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@food/components/ui/dialog";
import { Label } from "@food/components/ui/label";
import { Input } from "@food/components/ui/input";
import { Textarea } from "@food/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@food/components/ui/select";
import { useNotifyAdmin } from "../hooks/useNotifyAdmin";
import { Megaphone, AlertCircle } from "lucide-react";

export function NotifyAdminModal({ isOpen, onClose, shortage, estimatedRevenueLoss = 0 }) {
  const notifyAdminMutation = useNotifyAdmin();

  // Form State
  const [notificationType, setNotificationType] = useState("critical_shortage");
  const [priority, setPriority] = useState("high");
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const formatRupee = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(value);
  };

  useEffect(() => {
    if (isOpen && shortage) {
      setNotificationType("critical_shortage");
      setPriority(shortage.severity === "critical" ? "critical" : "high");
      setMessage(`CRITICAL INVENTORY ALERT: ${shortage.ingredientName} stock level has depleted. Fulfilling active orders is blocked. Affecting ${shortage.affectedOrders} active customer orders with an estimated revenue risk of ${formatRupee(estimatedRevenueLoss)}. Requesting immediate logistics intervention.`);
      setErrorMsg("");
    }
  }, [isOpen, shortage, estimatedRevenueLoss]);

  if (!shortage) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!message.trim()) {
      setErrorMsg("Alert message description is required");
      return;
    }

    notifyAdminMutation.mutate(
      {
        shortageId: shortage._id,
        type: notificationType,
        message: message.trim(),
        priority
      },
      {
        onSuccess: () => {
          onClose();
        }
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-40px)] max-w-xl lg:max-w-[calc(100vw-340px)] xl:max-w-xl lg:left-[calc(50%+140px)] p-4 md:p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden max-h-[90vh] md:max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <DialogHeader className="mb-3">
          <DialogTitle className="text-sm font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
            <Megaphone className="text-rose-500 w-4.5 h-4.5" />
            Dispatch Emergency Notification
          </DialogTitle>
          <DialogDescription className="text-zinc-550 dark:text-zinc-400 text-[10px]">
            Alert store administrators and procurement units about ongoing shortages impacting active orders.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 pr-1 select-none text-xs">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 text-[11px] flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Grid fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            
            {/* Notification Type */}
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">Notification Type</Label>
              <Select value={notificationType} onValueChange={(val) => setNotificationType(val)}>
                <SelectTrigger className="w-full h-8 rounded-lg border-zinc-200 dark:border-zinc-850 dark:bg-zinc-950 text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-zinc-950">
                  <SelectItem value="critical_shortage" className="text-xs font-semibold py-1.5">Critical Shortage Alert</SelectItem>
                  <SelectItem value="inventory_transfer" className="text-xs font-semibold py-1.5">Stock Transfer Escalation</SelectItem>
                  <SelectItem value="order_delay" className="text-xs font-semibold py-1.5">Order Delay Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">Alert Priority</Label>
              <Select value={priority} onValueChange={(val) => setPriority(val)}>
                <SelectTrigger className="w-full h-8 rounded-lg border-zinc-200 dark:border-zinc-850 dark:bg-zinc-950 text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-zinc-950">
                  <SelectItem value="high" className="text-xs font-semibold py-1.5">▲ High Priority</SelectItem>
                  <SelectItem value="critical" className="text-xs font-semibold py-1.5">★ Critical Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Affected Orders Count (Readonly) */}
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">Affected Active Orders</Label>
              <Input 
                type="text"
                value={`${shortage.affectedOrders} Orders`}
                disabled
                className="h-8 px-2.5 rounded-lg border-zinc-100 bg-slate-50 dark:bg-zinc-950 dark:border-zinc-850 text-zinc-400 font-semibold"
              />
            </div>

            {/* Revenue Loss Impact (Readonly) */}
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">Revenue-At-Risk Impact</Label>
              <Input 
                type="text"
                value={formatRupee(estimatedRevenueLoss)}
                disabled
                className="h-8 px-2.5 rounded-lg border-zinc-150 bg-slate-50 dark:bg-zinc-950 dark:border-zinc-850 text-rose-600 dark:text-rose-405 font-bold"
              />
            </div>

            {/* Custom Alert Message */}
            <div className="md:col-span-2 space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">Alert Escalation Message *</Label>
              <Textarea 
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setErrorMsg("");
                }}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-[var(--primary)] min-h-[120px] resize-none"
                required
              />
            </div>

          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-bold text-slate-700 dark:text-zinc-300 transition-colors"
              disabled={notifyAdminMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={notifyAdminMutation.isPending || !message.trim()}
              className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white transition-all shadow-sm flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              {notifyAdminMutation.isPending ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Dispatching...
                </>
              ) : (
                "Dispatch Alert"
              )}
            </button>
          </div>

        </form>

      </DialogContent>
    </Dialog>
  );
}
