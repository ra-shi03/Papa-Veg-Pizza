import React from "react"

/**
 * What is inside a combo line, under the line on the order screens: the pizzas the kitchen makes (orange dot) and the
 * dips, crispies and drinks that are packed with the order (blue dot, "PACK"). Renders nothing for a normal line.
 * `plain` (the delivery screens): one neutral list, no made / packed marks, since it is all in the bag by then.
 * The list is per one combo; when the line is for more than one the heading says so.
 */
export default function ComboComponents({ item, className = "", plain = false }) {
  const parts = item?.components
  if (!Array.isArray(parts) || parts.length === 0) return null
  const many = Number(item.quantity) > 1
  return (
    <div className={`rounded-xl bg-orange-50/60 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/30 px-3 py-2 ${className}`}>
      <p className="m-0 mb-1 text-[9px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
        {many ? `In each of the ${item.quantity} combos` : "Combo includes"}
      </p>
      <ul className="m-0 p-0 list-none space-y-0.5" aria-label="Combo contents">
        {parts.map((c, i) => (
          <li key={i} className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${plain ? "bg-zinc-400" : c.kitchen ? "bg-orange-500" : "bg-sky-500"}`}
              title={plain ? undefined : c.kitchen ? "Made in the kitchen" : "Packed with the order"}
            />
            <span className="min-w-0">
              {c.label ? <span className="text-zinc-400">{c.label}: </span> : null}
              <b>{c.name}</b>
              {c.size ? ` (${c.size})` : ""}
              {c.quantity > 1 ? ` ×${c.quantity}` : ""}
            </span>
            {!plain && !c.kitchen && <span className="ml-auto text-[8px] font-black uppercase tracking-wide text-sky-600 dark:text-sky-400">pack</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
