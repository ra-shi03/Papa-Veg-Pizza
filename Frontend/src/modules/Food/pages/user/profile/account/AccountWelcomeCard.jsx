import React from "react"

export default function AccountWelcomeCard({ onSignIn, isLoggedIn }) {
  if (isLoggedIn) {
    return (
      <h2 className="font-headline-lg-mobile text-headline-lg-mobile font-black mb-4 text-slate-900 dark:text-white text-left px-1">
        Account & Settings 👋
      </h2>
    )
  }

  return (
    <section className="glass-card rounded-2xl p-margin-mobile shadow-lg mb-md text-left transition-all duration-300">
      {/* Title */}
      <h2 className="font-headline-lg-mobile text-headline-lg-mobile font-black mb-2 text-slate-900 dark:text-white">
        Account & Settings 👋
      </h2>

      {/* Subtitle */}
      <p className="text-sm opacity-70 mb-5 leading-relaxed text-slate-600 dark:text-[#e4beb9]">
        Sign in to receive exclusive deals, live updates on your orders and personalized offers.
      </p>

      {/* Sign In / Register CTA Button */}
      <button
        onClick={onSignIn}
        className="w-full h-12 bg-primary hover:bg-red-700 text-on-primary font-bold rounded-xl text-xs tracking-wider uppercase cursor-pointer active:scale-95 transition-all shadow-[0_0_15px_rgba(229,57,53,0.3)] border-0"
      >
        Sign In / Register
      </button>
    </section>
  )
}
