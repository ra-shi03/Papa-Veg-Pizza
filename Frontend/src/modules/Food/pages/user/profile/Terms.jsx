import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import AnimatedPage from "@food/components/user/AnimatedPage";
import api from "@food/api";
import useAppBackNavigation from "@food/hooks/useAppBackNavigation";
import { API_ENDPOINTS } from "@food/api/config";
import { parseTermsSections } from "@food/constants/termsData";

export default function Terms() {
  const navigate = useNavigate();
  const goBack = useAppBackNavigation();
  const [loading, setLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState("Disclaimer");
  const [sections, setSections] = useState([]);
  // "error": the server could not be reached; "empty": it answered but no terms have been published
  const [problem, setProblem] = useState("");
  const [openSections, setOpenSections] = useState({ 0: true });

  useEffect(() => {
    fetchTermsData();
  }, []);

  const fetchTermsData = async () => {
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
  };

  const toggleSection = (index) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleBack = () => {
    navigate("/food/user");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F6F2] dark:bg-zinc-950 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary,#E53935)]" />
          <p className="text-zinc-400 font-semibold text-xs tracking-wider uppercase">Loading Terms...</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatedPage className="user-app-theme min-h-screen bg-[#F8F6F2] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans select-none pb-12">
      {/* Customer App Theme Top Bar */}
      <header className="sticky top-0 z-50 bg-[var(--primary,#E53935)] text-white shadow-md">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="p-1.5 -ml-1.5 text-white hover:bg-white/15 rounded-full transition-all active:scale-95 flex items-center justify-center cursor-pointer border-0 bg-transparent"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-white m-0 select-none">
            Terms & Conditions
          </h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">
        {/* Main Heading */}
        <h2 className="text-2xl font-bold text-center text-zinc-900 dark:text-white mb-6 tracking-tight">
          {pageTitle}
        </h2>

        {problem === "error" && (
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">The terms could not be loaded. Please check your connection and try again.</p>
        )}
        {problem === "empty" && (
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">The terms have not been published yet.</p>
        )}

        {/* Accordions List */}
        <div className="space-y-2.5">
          {sections.map((section, idx) => {
            const isOpen = !!openSections[idx];
            return (
              <div key={idx} className="transition-all duration-200">
                {/* Header Bar */}
                <button
                  type="button"
                  onClick={() => toggleSection(idx)}
                  className="w-full bg-[#f4f5f7] dark:bg-zinc-900/90 hover:bg-[#eaecee] dark:hover:bg-zinc-850 rounded-lg px-4 py-3.5 flex items-center justify-between text-left transition-colors cursor-pointer border border-transparent dark:border-zinc-800/60 shadow-2xs"
                >
                  <span className="text-[13.5px] font-medium text-zinc-700 dark:text-zinc-200 leading-snug pr-3">
                    {section.title}
                  </span>
                  <span className="text-[var(--primary,#E53935)] dark:text-red-400 font-bold text-xl leading-none select-none px-1">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                {/* Expanded Bullet List */}
                {isOpen && section.items && section.items.length > 0 && (
                  <div className="px-3 pt-3.5 pb-2.5 space-y-3 animate-in fade-in duration-200">
                    {section.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-start gap-3">
                        <span className="text-[8px] text-[var(--primary,#E53935)] dark:text-red-400 mt-1.5 shrink-0 select-none">
                          ■
                        </span>
                        <p className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal m-0">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </AnimatedPage>
  );
}