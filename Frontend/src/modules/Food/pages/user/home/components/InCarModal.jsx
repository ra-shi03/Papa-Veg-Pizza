import React from 'react';

export const InCarModal = ({ showCarModal, setShowCarModal, carNumber, setCarNumber, confirmLocation, triggerToast }) => {
  if (!showCarModal) return null;

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm dark">
      <div className="w-full max-w-sm glass-card rounded-3xl p-6 space-y-4 text-left">
        <div className="flex justify-between items-center">
          <h3 className="font-headline-lg-mobile text-lg text-white">In-Car Dining</h3>
          <button
            onClick={() => setShowCarModal(false)}
            className="material-symbols-outlined text-white/50 hover:text-white cursor-pointer bg-transparent border-0 outline-none"
          >
            close
          </button>
        </div>
        <p className="text-xs opacity-60 leading-relaxed text-white">
          Please enter your car number or vehicle registration details so we can deliver your hot pizza straight to your window:
        </p>

        {/* Input field */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase opacity-50 font-bold tracking-wider text-white">Car Number</span>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. DL 3C AB 1234"
              value={carNumber}
              onChange={(e) => setCarNumber(e.target.value)}
              className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white outline-none"
            />
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">
              directions_car
            </span>
          </div>
        </div>

        {/* Confirm button */}
        <button
          onClick={() => {
            const cleanCar = carNumber.trim()
            if (!cleanCar) {
              triggerToast("Please enter a valid car number")
              return
            }
            setCarNumber(cleanCar)
            confirmLocation({
              address: cleanCar,
              serviceType: "incar"
            })
            setShowCarModal(false)
            triggerToast("Car details confirmed!")
          }}
          className="w-full h-11 bg-primary text-on-primary font-bold rounded-xl text-xs uppercase cursor-pointer border-0 shadow-lg active:scale-95 transition-all"
        >
          Confirm Vehicle
        </button>
      </div>
    </div>
  );
};
