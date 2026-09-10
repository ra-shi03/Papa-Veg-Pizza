import React, { useState } from "react";
import { X, Search, Star, Truck, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useDeliveryPartners, useAssignRider } from "../ordersQuery";

export default function AssignRiderModal({ isOpen, onClose, order }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRiderId, setSelectedRiderId] = useState("");
  const [estimatedPickupTime, setEstimatedPickupTime] = useState("");
  const [notes, setNotes] = useState("");

  const { data: riders, isLoading: ridersLoading } = useDeliveryPartners(true);
  const { mutate, isLoading: assigning } = useAssignRider();

  if (!isOpen || !order) return null;

  // Filter riders by search query
  const filteredRiders = riders?.filter((rider) =>
    rider.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedRiderId) {
      toast.error("Please select a delivery partner first.");
      return;
    }

    mutate(
      {
        orderId: order.id,
        riderId: selectedRiderId,
        estimatedPickupTime: estimatedPickupTime || new Date(Date.now() + 15 * 60000).toISOString(),
        notes,
      },
      {
        onSuccess: () => {
          toast.success("Rider assigned successfully.");
          setSelectedRiderId("");
          setEstimatedPickupTime("");
          setNotes("");
          onClose();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to assign rider.");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-[700px] h-[90vh] max-h-[750px] bg-white dark:bg-zinc-955 rounded-2xl border border-zinc-150 dark:border-zinc-800 shadow-2xl overflow-hidden animate-scale-up flex flex-col">
        
        {/* Header */}
        <header className="p-4 border-b border-zinc-100 dark:border-zinc-850 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
              Assign Delivery Partner — {order.orderNumber}
            </h3>
            <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
              Select an active available rider to fulfill this order.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        {/* Scrollable Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
          
          {/* Search bar */}
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-2.5 text-zinc-400" size={14} />
            <input
              type="text"
              placeholder="Search rider by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-zinc-205 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>

          {/* Riders List */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Available Riders ({filteredRiders.length})
            </span>

            {ridersLoading ? (
              <div className="space-y-2">
                {[1, 2].map((n) => (
                  <div key={n} className="h-16 w-full animate-pulse bg-zinc-100 dark:bg-zinc-900 rounded-xl" />
                ))}
              </div>
            ) : filteredRiders.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredRiders.map((rider) => {
                  const isSelected = selectedRiderId === rider.riderId;
                  return (
                    <label 
                      key={rider.riderId}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected 
                          ? "border-[var(--primary)] bg-[var(--primary)]/5 dark:bg-[var(--primary)]/5"
                          : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={rider.photo} 
                          alt={rider.name} 
                          className="w-10 h-10 rounded-full object-cover border border-zinc-100 dark:border-zinc-800 shadow-sm"
                        />
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100">{rider.name}</p>
                          <div className="flex items-center gap-1.5 text-[9px] text-zinc-400 font-bold">
                            <span className="flex items-center gap-0.5 text-amber-500">
                              <Star size={10} className="fill-amber-500" />
                              {rider.rating}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Truck size={10} />
                              {rider.vehicleType}
                            </span>
                          </div>
                          <p className="text-[8px] text-zinc-500 font-medium">{rider.totalDeliveries} total jobs completed</p>
                        </div>
                      </div>

                      {/* Custom Radio Button */}
                      <input 
                        type="radio"
                        name="riderSelection"
                        value={rider.riderId}
                        checked={isSelected}
                        onChange={() => setSelectedRiderId(rider.riderId)}
                        className="h-4 w-4 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 text-xs font-semibold">
                No available delivery partners matching "{searchQuery}"
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-850 pt-4 mt-2">
            {/* Estimated Pickup Time (Datetime Picker) */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Estimated Pickup Time
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={estimatedPickupTime}
                  onChange={(e) => setEstimatedPickupTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>
              <p className="text-[9px] text-zinc-400 font-semibold mt-1">Default is 15 minutes from now.</p>
            </div>

            {/* Notes textarea */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Notes for Courier
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g., Fragile, keep pizzas flat, or call before entering the gate..."
                rows={2}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>
          </div>

          {/* Footer actions */}
          <footer className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-850 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assigning || !selectedRiderId}
              className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:bg-zinc-200 disabled:dark:bg-zinc-800 disabled:text-zinc-400 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-md shadow-[var(--primary)]/15 active:scale-95 transition-all"
            >
              {assigning ? "Assigning..." : "Assign Rider"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
