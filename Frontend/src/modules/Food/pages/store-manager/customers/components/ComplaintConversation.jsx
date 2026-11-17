import React, { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { useRespondToComplaint } from "../hooks/useComplaints";

// The chat the customer has open on their order-help screen: what they wrote, and the store's replies.
export default function ComplaintConversation({ complaint }) {
  const [text, setText] = useState("");
  const respond = useRespondToComplaint();
  const resolved = complaint.status === "resolved";
  const thread = [
    { message: complaint.description, byRole: "Customer", at: complaint.createdAt },
    ...(complaint.responses || []),
  ].filter((m) => m.message);

  const send = (e) => {
    e.preventDefault();
    const message = text.trim();
    if (!message) return;
    respond.mutate({ complaintId: complaint._id, message }, { onSuccess: () => setText("") });
  };

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800 space-y-3 text-xs font-semibold">
      <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-2">
        <MessageCircle size={15} className="text-[var(--primary)]" />
        Conversation with the customer
      </h4>
      <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
        {thread.map((m, i) => {
          const customer = m.byRole === "Customer";
          return (
            <div key={`${m.at}-${i}`} className={`flex ${customer ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${customer ? "bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850" : "bg-[var(--primary)] text-white"}`}>
                <p className="whitespace-pre-wrap break-words font-bold">{m.message}</p>
                <p className={`mt-1 text-[10px] ${customer ? "text-zinc-400" : "text-white/70"}`}>
                  {customer ? "Customer" : m.byName || "Store"} · {m.at ? new Date(m.at).toLocaleString() : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {!resolved && (
        <form onSubmit={send} className="flex items-center gap-2 pt-1">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            placeholder="Reply to the customer"
            className="flex-1 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 text-xs font-semibold outline-none focus:border-[var(--primary)]"
          />
          <button
            type="submit"
            disabled={respond.isPending || !text.trim()}
            className="h-10 w-10 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white flex items-center justify-center disabled:opacity-50 cursor-pointer border-0"
          >
            <Send size={14} />
          </button>
        </form>
      )}
    </div>
  );
}
