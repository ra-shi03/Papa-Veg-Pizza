import React from "react";
import { X, Phone, MessageSquare, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function ContactCustomerModal({ isOpen, onClose, customer }) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !customer) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(customer.phone);
    setCopied(true);
    toast.success("Phone number copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCall = () => {
    window.location.href = `tel:${customer.phone}`;
    toast.success(`Dialing customer: ${customer.name}...`);
  };

  const handleWhatsApp = () => {
    const formattedPhone = customer.phone.replace(/[^0-9]/g, ""); // Keep numbers only
    const url = `https://wa.me/${formattedPhone}?text=Hello%20${encodeURIComponent(customer.name)},%20this%20is%20Papa%20Veg%20Pizza%20regarding%20your%20live%20order.`;
    window.open(url, "_blank");
    toast.success("Opening WhatsApp chat...");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-[480px] bg-white dark:bg-zinc-955 rounded-2xl border border-zinc-150 dark:border-zinc-800 shadow-2xl overflow-hidden animate-scale-up">
        
        {/* Header */}
        <header className="p-4 border-b border-zinc-100 dark:border-zinc-850 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
            Contact Customer
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-650 transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3.5 pb-2">
            <img 
              src={customer.avatar} 
              alt={customer.name} 
              className="w-14 h-14 rounded-full object-cover border border-zinc-100 dark:border-zinc-800 shadow-sm"
            />
            <div>
              <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">{customer.name}</h4>
              <p className="text-[10px] text-zinc-400 font-bold mt-0.5">{customer.phone}</p>
              <p className="text-[10px] text-zinc-450 font-medium truncate mt-0.5">{customer.email}</p>
            </div>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-1">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
              Delivery Address
            </span>
            <p className="text-xs text-zinc-700 dark:text-zinc-350 font-semibold leading-relaxed">
              {customer.address}
            </p>
          </div>

          {/* Quick Action Grid */}
          <div className="grid grid-cols-3 gap-2.5 pt-2">
            {/* Call */}
            <button
              onClick={handleCall}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/30 hover:bg-emerald-500/5 text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all cursor-pointer group"
            >
              <Phone size={18} className="stroke-[2.2] group-hover:scale-105 transition-transform" />
              <span className="text-[10px] font-extrabold mt-1.5">Direct Call</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={handleWhatsApp}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-green-500/30 hover:bg-green-500/5 text-zinc-700 dark:text-zinc-300 hover:text-green-600 dark:hover:text-green-400 transition-all cursor-pointer group"
            >
              <MessageSquare size={18} className="stroke-[2.2] group-hover:scale-105 transition-transform" />
              <span className="text-[10px] font-extrabold mt-1.5">WhatsApp</span>
            </button>

            {/* Copy */}
            <button
              onClick={handleCopy}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/30 hover:bg-blue-500/5 text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer group"
            >
              {copied ? (
                <Check size={18} className="text-blue-550 dark:text-blue-400 stroke-[2.2]" />
              ) : (
                <Copy size={18} className="stroke-[2.2] group-hover:scale-105 transition-transform" />
              )}
              <span className="text-[10px] font-extrabold mt-1.5">{copied ? "Copied" : "Copy Number"}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="p-4 border-t border-zinc-100 dark:border-zinc-850 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
