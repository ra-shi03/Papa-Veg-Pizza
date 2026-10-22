import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/services/api/axios";

export default function WelcomeScreen() {
  const navigate = useNavigate();
  
  const [config, setConfig] = useState(null);
  const [activePoster, setActivePoster] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const timerRef = useRef(null);
  const currentIndexRef = useRef(0);
  const hasRunRef = useRef(false);

  // Navigate forward to login page
  const handleProceed = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    sessionStorage.setItem("papa_veg_welcome_shown", "true");
    navigate("/food/user/auth/login", { replace: true });
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await axiosInstance.get('/settings/welcome');
        let data = res.data?.data;
        
        if (!data) {
          data = { posters: [] };
        }

        setConfig(data);
        
        const now = new Date();
        let validPosters = data.posters
          ?.filter(p => p.isActive !== false)
          ?.filter(p => p.imageUrl && typeof p.imageUrl === 'string' && p.imageUrl.trim() !== "")
          ?.filter(p => {
            if (!p.startDate) return true;
            const d = new Date(p.startDate);
            return isNaN(d.getTime()) || d <= now;
          })
          ?.filter(p => {
            if (!p.endDate) return true;
            const d = new Date(p.endDate);
            return isNaN(d.getTime()) || d >= now;
          })
          ?.sort((a, b) => (a.order || 0) - (b.order || 0)) || [];

        // Fallback to legacy hero image or a default poster if no dynamic posters exist
        if (validPosters.length === 0) {
          validPosters = [{
            id: "fallback",
            imageUrl: data.heroMediaUrl || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
            order: 0,
            isActive: true
          }];
        }

        let lastIndex = parseInt(localStorage.getItem("lastShownPosterIndex"), 10);
        let nextIndex = 0;
        
        if (validPosters.length > 0) {
          if (!hasRunRef.current) {
            hasRunRef.current = true;
            if (isNaN(lastIndex)) {
              nextIndex = 0;
            } else {
              nextIndex = (lastIndex + 1) % validPosters.length;
            }
          } else {
            nextIndex = isNaN(lastIndex) ? 0 : lastIndex;
          }
        }
        
        localStorage.setItem("lastShownPosterIndex", nextIndex.toString());
        
        currentIndexRef.current = nextIndex;
        setActivePoster(validPosters[nextIndex]);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load welcome screen config", err);
        setConfig({});
        setActivePoster({
          id: "fallback_error",
          imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
          isActive: true
        });
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  useEffect(() => {
    if (!activePoster || loading) return;

    const durationSeconds = Number(config?.posterDurationSeconds) > 0 
      ? Number(config.posterDurationSeconds) 
      : 8;
    const durationMs = durationSeconds * 1000;

    timerRef.current = setTimeout(() => {
      handleProceed();
    }, durationMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activePoster, loading, config]);

  const handlePosterClick = () => {
    if (activePoster?.deepLink) {
      if (timerRef.current) clearTimeout(timerRef.current);
      sessionStorage.setItem("papa_veg_welcome_shown", "true");
      if (activePoster.deepLink.startsWith("http://") || activePoster.deepLink.startsWith("https://")) {
        window.location.href = activePoster.deepLink;
      } else {
        navigate(activePoster.deepLink, { replace: true });
      }
    }
    // Do NOT navigate to login on tap if there is no deepLink.
    // The screen only navigates to login when the configured duration timer expires.
  };

  if (loading || !activePoster) {
    return <div className="w-full h-[100dvh] bg-black"></div>;
  }

  const showSkipButton = Boolean(
    config &&
    config.enableSkipButton !== false &&
    config.enableSkipButton !== "false" &&
    config.enableSkipButton !== 0 &&
    config.enableSkipButton !== "0"
  );

  return (
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden select-none">
      {/* Skip Button */}
      {showSkipButton && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleProceed();
          }}
          className="absolute top-12 right-6 z-20 px-5 py-2 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white text-sm font-semibold rounded-full uppercase tracking-wider border border-white/20 transition-all cursor-pointer shadow-lg"
        >
          Skip
        </button>
      )}

      {/* Poster Image - Covers overall length and width of mobile screen edge-to-edge */}
      <img 
        src={activePoster.imageUrl} 
        alt="Promo"
        className={`w-full h-full object-cover ${activePoster?.deepLink ? "cursor-pointer" : "cursor-default"}`}
        onClick={handlePosterClick}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80";
        }}
      />
    </div>
  );
}
