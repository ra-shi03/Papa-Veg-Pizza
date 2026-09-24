import React from "react";

export function BottomNavBar({
  navigate,
  triggerToast,
  totalCartCount = 0,
  locationConfirmed = false
}) {
  return (
    <>
      {/* Floating Action Cart Button */}
      {totalCartCount > 0 && locationConfirmed && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 w-full max-w-md pointer-events-none z-45">
          <button
            onClick={() => {
              navigate("/user/cart");
              triggerToast("Opening your cart...");
            }}
            className="absolute right-4 bottom-0 pointer-events-auto w-14 h-14 bg-primary text-on-primary rounded-full shadow-[0_0_20px_rgba(229,57,53,0.4)] flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
          >
            <span className="material-symbols-outlined text-[28px]">shopping_basket</span>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-white text-on-primary-container rounded-full text-[10px] font-bold flex items-center justify-center border border-primary animate-bounce">
              {totalCartCount}
            </div>
          </button>
        </div>
      )}

      {/* Floating Navigation Bar */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[360px] z-50 rounded-full bg-[#FAF9F6]/90 dark:bg-zinc-950/95 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_16px_36px_rgba(0,0,0,0.15)] flex justify-around items-center h-[68px] px-2 m-0">
        <button
          onClick={() => {
            if (window.location.pathname === "/user" || window.location.pathname === "/user/") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              navigate("/user");
            }
            triggerToast("Opening Home");
          }}
          className="flex flex-col items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer bg-transparent border-0 outline-none group"
        >
          <div className="w-14 h-8 rounded-full flex items-center justify-center mb-0.5 transition-all duration-300 bg-[#E53935]/10 text-[#E53935] dark:bg-[#E53935]/20">
            <span className="material-symbols-outlined text-[22px] fill" style={{ fontVariationSettings: " 'FILL' 1 " }}>home</span>
          </div>
          <span className="text-[10px] font-bold tracking-wide text-[#E53935]">Home</span>
        </button>

        <button
          onClick={() => {
            navigate("/user/menu");
            triggerToast("Opening Menu");
          }}
          className="flex flex-col items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer bg-transparent border-0 outline-none group"
        >
          <div className="w-14 h-8 rounded-full flex items-center justify-center mb-0.5 transition-all duration-300 bg-transparent text-zinc-500 dark:text-zinc-400 group-hover:bg-black/5 dark:group-hover:bg-white/5">
            <span className="material-symbols-outlined text-[22px]">restaurant_menu</span>
          </div>
          <span className="text-[10px] font-semibold tracking-wide text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200">Menu</span>
        </button>

        <button
          onClick={() => {
            navigate("/user/account");
            triggerToast("Opening Account");
          }}
          className="flex flex-col items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer bg-transparent border-0 outline-none group"
        >
          <div className="w-14 h-8 rounded-full flex items-center justify-center mb-0.5 transition-all duration-300 bg-transparent text-zinc-500 dark:text-zinc-400 group-hover:bg-black/5 dark:group-hover:bg-white/5">
            <span className="material-symbols-outlined text-[22px]">person</span>
          </div>
          <span className="text-[10px] font-semibold tracking-wide text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200">Account</span>
        </button>
      </nav>
    </>
  );
}
