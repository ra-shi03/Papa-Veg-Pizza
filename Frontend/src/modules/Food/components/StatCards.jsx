import { useNavigate } from "react-router-dom"
import { ArrowUpRight } from "lucide-react"

/**
 * Dashboard stats cards (same look as the Jharkhand Rasoi admin dashboard), shared by the super admin and franchise
 * admin dashboards: a panel with a header, sections of tinted cards with a label, value, helper line and icon tile.
 */

/** Rounded panel with the "Admin Overview" style header, optional filters on the right, and a loading overlay. */
export function StatsPanel({ eyebrow, title, actions, loading, children }) {
  return (
    <section className="relative mb-6 overflow-hidden rounded-3xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-[0_30px_120px_-60px_rgba(0,0,0,0.28)]">
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 dark:bg-zinc-950/70 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-full bg-white dark:bg-zinc-900 px-4 py-2 text-sm text-neutral-700 dark:text-zinc-200 ring-1 ring-neutral-200 dark:ring-zinc-800">
            <span className="h-3 w-3 animate-ping rounded-full bg-neutral-800/70 dark:bg-white/70" />
            Updating metrics...
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 border-b border-neutral-200 dark:border-zinc-800 bg-gradient-to-br from-white via-neutral-50 to-neutral-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-900 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 dark:text-zinc-400">{eyebrow}</p>
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">{title}</h2>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>

      <div className="space-y-8 px-6 py-6">{children}</div>
    </section>
  )
}

/** A titled group of cards; className sets the grid columns. */
export function StatSection({ title, subtitle, className, children }) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold tracking-wide uppercase text-neutral-500 dark:text-zinc-400">{title}</h3>
        <p className="text-xs text-neutral-400 dark:text-zinc-500">{subtitle}</p>
      </div>
      <div className={`grid gap-4 ${className}`}>{children}</div>
    </div>
  )
}

/** One card. Clicking it opens `path`, the page behind the figure. */
export function MetricCard({ title, value, helper, icon: Icon, iconClass, accent, path }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => path && navigate(path)}
      className="group relative overflow-hidden rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]"
    >
      <div className={`absolute inset-0 opacity-40 transition-opacity duration-300 group-hover:opacity-60 ${accent}`} />
      <div className="relative z-10 flex items-center justify-between p-4">
        <div className="flex-1 min-w-0 mr-2">
          <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 dark:text-zinc-400 font-bold mb-1 truncate">{title}</p>
          <p className="text-xl font-bold text-neutral-900 dark:text-white leading-tight mb-1">{value}</p>
          <p className="text-[10px] text-neutral-500 dark:text-zinc-400 font-medium line-clamp-1">{helper}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/90 dark:bg-zinc-800 ring-1 ring-neutral-200 dark:ring-zinc-700 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-md">
          <Icon className={`h-5 w-5 ${iconClass}`} />
        </div>
      </div>
      <div className="absolute bottom-2 right-2 opacity-0 translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
        <ArrowUpRight className="h-3 w-3 text-neutral-400" />
      </div>
    </div>
  )
}
