import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function RemainingTimer({ startedTime, expectedDuration }) {
  const [display, setDisplay] = useState({ text: "00:00", isOverdue: false });

  useEffect(() => {
    if (!startedTime) {
      setDisplay({ text: "--:--", isOverdue: false });
      return;
    }

    const calculateTime = () => {
      const start = new Date(startedTime);
      const totalSec = expectedDuration * 60;
      const elapsedSec = Math.floor((new Date() - start) / 1000);
      const remainingSec = totalSec - elapsedSec;

      if (remainingSec <= 0) {
        // Overdue! Count up the delay
        const absSec = Math.abs(remainingSec);
        const mins = Math.floor(absSec / 60);
        const secs = absSec % 60;
        const text = `-${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")} Overdue`;
        return { text, isOverdue: true };
      } else {
        const mins = Math.floor(remainingSec / 60);
        const secs = remainingSec % 60;
        const text = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
        return { text, isOverdue: false };
      }
    };

    // Initial run
    setDisplay(calculateTime());

    const timer = setInterval(() => {
      setDisplay(calculateTime());
    }, 1000);

    return () => clearInterval(timer);
  }, [startedTime, expectedDuration]);

  if (!startedTime) {
    return <span className="text-slate-400 dark:text-zinc-555 font-bold">Not Started</span>;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-xs font-extrabold ${
        display.isOverdue 
          ? "text-rose-600 dark:text-rose-500 animate-pulse bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded-lg border border-rose-100 dark:border-rose-900/30" 
          : "text-slate-800 dark:text-zinc-200"
      }`}
    >
      <Clock size={11} className={display.isOverdue ? "text-rose-500" : "text-slate-400"} />
      {display.text}
    </span>
  );
}
