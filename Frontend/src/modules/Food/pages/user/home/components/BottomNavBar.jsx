import React from "react";

export function BottomNavBar({
  navigate,
  triggerToast,
  totalCartCount = 0,
  locationConfirmed = false
}) {
  return (
    <>
      {/* ── Domino's Style Full-Width Bottom Nav Bar ── */}
      <nav 
        className="fixed bottom-0 left-0 w-full z-50 bg-[#FFFFFF] dark:bg-[#121212] border-t border-black/5 dark:border-white/5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] flex justify-around items-center px-1 pb-safe"
        style={{ height: 64 }}
      >
        {/* Menu (Slice) */}
        <button
          onClick={() => {
            navigate("/user/menu");
            triggerToast("Opening Menu");
          }}
          className="flex flex-col items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer bg-transparent border-0 outline-none w-16 pt-1"
        >
          <span className="material-symbols-outlined text-[24px] text-zinc-500 dark:text-zinc-400">local_pizza</span>
          <span className="text-[10px] font-semibold tracking-wide text-zinc-500 dark:text-zinc-400 mt-1">Menu</span>
        </button>

        {/* Deals (Combos) */}
        <button
          onClick={() => {
            navigate("/user/deals");
            triggerToast("Opening Deals");
          }}
          className="flex flex-col items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer bg-transparent border-0 outline-none w-16 pt-1"
        >
          <span className="material-symbols-outlined text-[24px] text-zinc-500 dark:text-zinc-400">local_activity</span>
          <span className="text-[10px] font-semibold tracking-wide text-zinc-500 dark:text-zinc-400 mt-1">Deals</span>
        </button>

        {/* Home (Center Logo equivalent) */}
        <button
          onClick={() => {
            if (window.location.pathname === "/user" || window.location.pathname === "/user/") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              navigate("/user");
            }
            triggerToast("Opening Home");
          }}
          className="flex flex-col items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer bg-transparent border-0 outline-none relative -mt-4 w-16"
        >
          <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center bg-[#FFFFFF] dark:bg-zinc-900 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] text-[var(--accent-red)] z-10 relative border-t border-black/5 dark:border-white/5">
            <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center bg-[#EEECEA] dark:bg-zinc-800">
               <span className="material-symbols-outlined text-[28px] fill" style={{ fontVariationSettings: " 'FILL' 1 " }}>home</span>
            </div>
          </div>
          <span className="text-[10px] font-bold tracking-wide text-[var(--accent-red)] mt-0.5">Home</span>
        </button>

        {/* Cart / Reorder */}
        <button
          onClick={() => {
            navigate("/user/cart");
            triggerToast("Opening Cart");
          }}
          className="flex flex-col items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer bg-transparent border-0 outline-none w-16 relative pt-1"
        >
          <span className="material-symbols-outlined text-[24px] text-zinc-500 dark:text-zinc-400">shopping_bag</span>
          {totalCartCount > 0 && locationConfirmed && (
             <div className="absolute top-0 right-[14px] w-[18px] h-[18px] bg-[var(--accent-red)] text-white rounded-full text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-[#121212]">
                {totalCartCount}
             </div>
          )}
          <span className="text-[10px] font-semibold tracking-wide text-zinc-500 dark:text-zinc-400 mt-1">Cart</span>
        </button>

        {/* Account / Rewards */}
        <button
          onClick={() => {
            navigate("/user/account");
            triggerToast("Opening Account");
          }}
          className="flex flex-col items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer bg-transparent border-0 outline-none w-16 pt-1"
        >
          <span className="material-symbols-outlined text-[24px] text-zinc-500 dark:text-zinc-400">star</span>
          <span className="text-[10px] font-semibold tracking-wide text-zinc-500 dark:text-zinc-400 mt-1">Account</span>
        </button>
      </nav>
    </>
  );
}
