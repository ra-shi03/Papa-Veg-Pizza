import { useEffect, useState } from "react"
import { Loader2, Scale } from "lucide-react"
import { publicAPI } from "@food/api"

// Terms & Conditions for franchise owners. The text is the one the super admin publishes
// (Settings > Policies > Terms & Conditions > Franchise); the rider recovery / treatment clause is always part of it.
export default function TermsAndConditions() {
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState("")
  const [title, setTitle] = useState("Terms & Conditions")

  useEffect(() => {
    let alive = true
    publicAPI
      .getTerms("terms_franchise")
      .then((res) => {
        const data = res?.data?.data || {}
        if (!alive) return
        setContent(data.content || "")
        if (data.title) setTitle(data.title)
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Scale className="w-5 h-5 text-[#E53935]" />
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h1>
      </div>
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#E53935]" /></div>
        ) : (
          <div
            data-testid="franchise-terms"
            className="prose prose-sm max-w-none text-zinc-700 dark:text-zinc-300 dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: toHtml(content) }}
          />
        )}
      </div>
    </div>
  )
}

// The server sends HTML once an admin has saved the page, and plain text (# heading / - bullet) for the default.
function toHtml(text) {
  const s = String(text || "")
  if (/<\/?[a-z][^>]*>/i.test(s)) return s
  const esc = (v) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  let out = "", list = false
  for (const raw of s.split("\n")) {
    const l = raw.trim()
    const h = l.match(/^#+\s+(.*)$/), b = l.match(/^[-*]\s+(.*)$/)
    if (!b && list) { out += "</ul>"; list = false }
    if (h) out += `<h3>${esc(h[1])}</h3>`
    else if (b) { if (!list) { out += "<ul>"; list = true } out += `<li>${esc(b[1])}</li>` }
    else if (l) out += `<p>${esc(l)}</p>`
  }
  return out + (list ? "</ul>" : "")
}
