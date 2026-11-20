import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowLeft, Printer, Search, X, ChevronDown, ArrowUp, RotateCcw, FileText, Headset, ChevronsUpDown } from "lucide-react";
import AnimatedPage from "@food/components/user/AnimatedPage";
import api from "@food/api";
import { API_ENDPOINTS } from "@food/api/config";
import { parseTermsSections } from "@food/constants/termsData";

// The terms come from the super admin (Settings > Content Management > Policies > Terms & Conditions).

const READ_WORDS_PER_MIN = 200;

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// **bold** from the admin editor becomes bold text, and the words being searched are highlighted
function RichText({ text, query }) {
  const q = query.trim();
  const mark = (str, keyPrefix) => {
    if (!q) return str;
    return str.split(new RegExp(`(${escapeRegExp(q)})`, "ig")).map((part, i) =>
      part.toLowerCase() === q.toLowerCase()
        ? <mark key={`${keyPrefix}-${i}`} className="bg-amber-200 dark:bg-amber-500/40 text-inherit rounded px-0.5">{part}</mark>
        : part
    );
  };
  return String(text)
    .split(/\*\*(.+?)\*\*/g)
    .map((part, i) => (i % 2 === 1
      ? <strong key={i} className="font-semibold text-zinc-900 dark:text-white">{mark(part, i)}</strong>
      : <React.Fragment key={i}>{mark(part, i)}</React.Fragment>));
}

const plain = (s) => String(s).replace(/\*\*/g, "");

function Skeleton() {
  return (
    <div className="space-y-2.5 animate-pulse" aria-hidden>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-14 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800" />
      ))}
    </div>
  );
}

export default function Terms() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState("Terms & Conditions");
  const [sections, setSections] = useState([]);
  // "error": the server could not be reached; "empty": it answered but no terms have been published
  const [problem, setProblem] = useState("");
  const [open, setOpen] = useState({ 0: true });
  const [query, setQuery] = useState("");
  const [showTop, setShowTop] = useState(false);

  const fetchTermsData = useCallback(async () => {
    try {
      setLoading(true);
      setProblem("");
      const response = await api.get(API_ENDPOINTS.ADMIN.TERMS_PUBLIC);
      const data = response?.data?.success ? response?.data?.data : null;
      if (data?.title) setPageTitle(data.title);
      const parsed = data?.content ? parseTermsSections(data.content) : [];
      if (parsed && parsed.length > 0) setSections(parsed);
      else setProblem("empty");
    } catch (error) {
      console.warn("Could not fetch the terms:", error);
      setProblem("error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchTermsData();
  }, [fetchTermsData]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const q = query.trim().toLowerCase();
  // Keep each section's original number so "7" still means the same section while searching
  const visible = useMemo(
    () => sections
      .map((s, index) => ({ ...s, index }))
      .filter((s) => !q || plain(s.title).toLowerCase().includes(q) || s.items.some((it) => plain(it).toLowerCase().includes(q))),
    [sections, q]
  );

  const minutes = useMemo(() => {
    const words = sections.reduce((n, s) => n + plain(s.title).split(/\s+/).length + s.items.reduce((m, it) => m + plain(it).split(/\s+/).length, 0), 0);
    return Math.max(1, Math.round(words / READ_WORDS_PER_MIN));
  }, [sections]);

  // While searching, every matching section is open so the match is visible
  const isOpen = (index) => (q ? true : !!open[index]);
  const allOpen = sections.length > 0 && sections.every((_, i) => open[i]);
  const toggle = (index) => setOpen((prev) => ({ ...prev, [index]: !prev[index] }));
  const setAll = (value) => setOpen(Object.fromEntries(sections.map((_, i) => [i, value])));

  const handleBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate("/food/user/account", { replace: true }));
  const handlePrint = () => { setAll(true); setTimeout(() => window.print(), 150); };

  return (
    <AnimatedPage className="user-app-theme min-h-screen bg-[#F8F6F2] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans pb-16">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          .print-body { background: #fff !important; color: #000 !important; }
          .print-body section { break-inside: avoid; }
        }
      ` }} />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--primary,#E53935)] text-white shadow-md no-print">
        <div className="max-w-2xl mx-auto px-2 h-14 flex items-center justify-between">
          <div className="flex items-center gap-1 min-w-0">
            <button type="button" onClick={handleBack} aria-label="Back" className="p-2 text-white hover:bg-white/15 rounded-full transition-all active:scale-95 cursor-pointer border-0 bg-transparent">
              <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
            </button>
            <h1 className="text-lg font-bold tracking-tight text-white m-0 truncate">Terms &amp; Conditions</h1>
          </div>
          {sections.length > 0 && (
            <button type="button" onClick={handlePrint} aria-label="Print or save as PDF" title="Print / save as PDF" className="p-2 text-white hover:bg-white/15 rounded-full transition-all active:scale-95 cursor-pointer border-0 bg-transparent">
              <Printer className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 pt-5 print-body">
        {/* Intro card */}
        <div className="rounded-3xl p-5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center bg-[var(--primary,#E53935)]/10 text-[var(--primary,#E53935)]">
              <FileText className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-extrabold tracking-tight m-0 leading-snug">{pageTitle}</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 m-0">
                Please read before you order
                {sections.length > 0 && <> · {sections.length} sections · about {minutes} min read</>}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mt-4"><Skeleton /></div>
        ) : problem === "error" ? (
          <div className="mt-12 text-center px-6">
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">The terms could not be loaded. Please check your connection and try again.</p>
            <button type="button" onClick={fetchTermsData} className="mt-4 px-5 py-2.5 rounded-xl bg-[var(--primary,#E53935)] text-white text-sm font-bold border-0 cursor-pointer inline-flex items-center gap-2">
              <RotateCcw className="w-4 h-4" /> Try again
            </button>
          </div>
        ) : problem === "empty" ? (
          <p className="mt-12 text-center text-sm text-zinc-500 dark:text-zinc-400">The terms have not been published yet.</p>
        ) : (
          <>
            {/* Search + expand/collapse stay in view while reading */}
            <div className="sticky top-14 z-20 -mx-4 px-4 pt-3 pb-2 bg-[#F8F6F2] dark:bg-zinc-950 no-print">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text" inputMode="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search the terms (e.g. refund, delivery, OTP)"
                  aria-label="Search the terms"
                  className="w-full h-11 rounded-xl pl-10 pr-10 text-sm outline-none bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 focus:border-[var(--primary,#E53935)]"
                />
                {query && (
                  <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 border-0 bg-transparent cursor-pointer text-zinc-400">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span aria-live="polite">{q ? `${visible.length} of ${sections.length} sections match` : `${sections.length} sections`}</span>
                {!q && (
                  <button type="button" onClick={() => setAll(!allOpen)} className="inline-flex items-center gap-1 font-semibold text-[var(--primary,#E53935)] bg-transparent border-0 p-0 cursor-pointer">
                    <ChevronsUpDown className="w-3.5 h-3.5" />{allOpen ? "Collapse all" : "Expand all"}
                  </button>
                )}
              </div>
            </div>

            {visible.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Nothing matches &ldquo;{query}&rdquo;</p>
                <button type="button" onClick={() => setQuery("")} className="mt-2 text-sm font-bold text-[var(--primary,#E53935)] bg-transparent border-0 cursor-pointer">Clear search</button>
              </div>
            ) : (
              <div className="mt-1 space-y-2.5">
                {visible.map((section) => {
                  const expanded = isOpen(section.index);
                  return (
                    <section key={section.index} className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggle(section.index)}
                        aria-expanded={expanded}
                        className="w-full px-4 py-3.5 flex items-center gap-3 text-left cursor-pointer border-0 bg-transparent"
                      >
                        <span className={`w-7 h-7 shrink-0 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${expanded ? "bg-[var(--primary,#E53935)] text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"}`}>
                          {section.index + 1}
                        </span>
                        <span className="flex-1 text-[14px] font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
                          <RichText text={section.title} query={query} />
                        </span>
                        <ChevronDown className={`w-4 h-4 shrink-0 text-zinc-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
                      </button>

                      <AnimatePresence initial={false}>
                        {expanded && (
                          <motion.div
                            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <ul className="list-none m-0 px-4 pb-4 pt-0.5 space-y-2.5 border-t border-zinc-100 dark:border-zinc-800">
                              {section.items.map((item, i) => (
                                <li key={i} className={`flex items-start gap-3 ${i === 0 ? "pt-3" : ""}`}>
                                  <span className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0 bg-[var(--primary,#E53935)]" aria-hidden />
                                  <p className="text-[13.5px] text-zinc-600 dark:text-zinc-300 leading-relaxed m-0">
                                    <RichText text={item} query={query} />
                                  </p>
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </section>
                  );
                })}
              </div>
            )}

            {/* Help */}
            <div className="mt-6 rounded-2xl p-4 flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 no-print">
              <span className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-[var(--primary,#E53935)]/10 text-[var(--primary,#E53935)]">
                <Headset className="w-5 h-5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold m-0">Have a question about these terms?</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 m-0 mt-0.5">Our support team is happy to help.</p>
              </div>
              <button type="button" onClick={() => navigate("/user/help")} className="px-3.5 py-2 rounded-xl bg-[var(--primary,#E53935)] text-white text-xs font-bold border-0 cursor-pointer shrink-0">
                Get help
              </button>
            </div>
          </>
        )}
      </main>

      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })}
          aria-label="Back to top"
          className="no-print fixed bottom-5 right-5 z-40 w-11 h-11 rounded-full flex items-center justify-center bg-[var(--primary,#E53935)] text-white shadow-lg border-0 cursor-pointer active:scale-95"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </AnimatedPage>
  );
}
