import { useEffect } from "react";

let activeLocksCount = 0;
let originalBodyOverflow = "";
let originalHtmlOverflow = "";
let originalBodyOverscroll = "";
let originalHtmlOverscroll = "";
let originalBodyPaddingRight = "";

export function lockBodyScroll() {
  if (typeof document === "undefined") return;

  if (activeLocksCount === 0) {
    originalBodyOverflow = document.body.style.overflow;
    originalHtmlOverflow = document.documentElement.style.overflow;
    originalBodyOverscroll = document.body.style.overscrollBehavior;
    originalHtmlOverscroll = document.documentElement.style.overscrollBehavior;
    originalBodyPaddingRight = document.body.style.paddingRight;

    // Compensate for scrollbar disappearance on desktop to avoid layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    document.documentElement.style.overscrollBehavior = "none";
  }

  activeLocksCount++;
}

export function unlockBodyScroll() {
  if (typeof document === "undefined") return;

  activeLocksCount = Math.max(0, activeLocksCount - 1);

  if (activeLocksCount === 0) {
    document.body.style.overflow = originalBodyOverflow;
    document.documentElement.style.overflow = originalHtmlOverflow;
    document.body.style.overscrollBehavior = originalBodyOverscroll;
    document.documentElement.style.overscrollBehavior = originalHtmlOverscroll;
    document.body.style.paddingRight = originalBodyPaddingRight;
  }
}

/**
 * Hook to lock background/body scrolling when a modal or sheet is open.
 * @param {boolean} isLocked - Whether scroll should currently be locked.
 */
export function useScrollLock(isLocked = false) {
  useEffect(() => {
    if (!isLocked) return;

    lockBodyScroll();

    return () => {
      unlockBodyScroll();
    };
  }, [isLocked]);
}

export default useScrollLock;

