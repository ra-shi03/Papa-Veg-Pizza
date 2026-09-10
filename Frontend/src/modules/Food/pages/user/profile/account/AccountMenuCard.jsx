import React from "react"

export default function AccountMenuCard({ title, iconName, onClick }) {
  return (
    <div
      onClick={onClick}
      className="glass-card rounded-xl p-md flex items-center justify-between cursor-pointer transition-all duration-200 active:scale-[0.98] hover:bg-white/[0.08] dark:hover:bg-white/[0.08] shadow-sm border border-white/10 dark:border-white/10"
    >
      {/* Left section: Optional icon + Item label */}
      <div className="flex items-center gap-sm">
        {iconName && (
          <span className="material-symbols-outlined text-primary text-xl select-none">
            {iconName}
          </span>
        )}
        <span className="font-body-md text-sm font-semibold text-slate-800 dark:text-white">
          {title}
        </span>
      </div>

      {/* Right section: Right chevron icon */}
      <span className="material-symbols-outlined text-primary text-sm select-none opacity-80 hover:opacity-100">
        arrow_forward_ios
      </span>
    </div>
  )
}
