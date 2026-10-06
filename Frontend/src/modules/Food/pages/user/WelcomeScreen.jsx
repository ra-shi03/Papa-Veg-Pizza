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

  // Navigate forward based on auth state
  const handleProceed = () => {
    // Save the index ONLY when proceeding, avoiding React Strict Mode double-increments
    localStorage.setItem("lastShownPosterIndex", currentIndexRef.current.toString());
    localStorage.setItem("papa_veg_welcome_shown", "true");
    
    const isAuthenticated = localStorage.getItem("user_authenticated") === "true";
    if (isAuthenticated) {
      navigate("/food/user", { replace: true });
    } else {
      navigate("/user/auth/login", { replace: true });
    }
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await axiosInstance.get('/settings/welcome');
        const data = res.data?.data;
        
        if (!data) {
          handleProceed();
          return;
        }

        setConfig(data);
        
        const now = new Date();
        let validPosters = data.posters
          ?.filter(p => p.isActive)
          ?.filter(p => !p.startDate || new Date(p.startDate) <= now)
          ?.filter(p => !p.endDate || new Date(p.endDate) >= now)
          ?.sort((a, b) => (a.order || 0) - (b.order || 0)) || [];

        // Fallback to legacy hero image if no dynamic posters exist
        if (validPosters.length === 0) {
          if (data.heroMediaUrl) {
            validPosters = [{
              id: "fallback",
              imageUrl: data.heroMediaUrl,
              order: 0,
              isActive: true
            }];
          } else {
            handleProceed();
            return;
          }
        }

        // Determine which poster to show based on last stored index
        let lastIndex = parseInt(localStorage.getItem("lastShownPosterIndex"), 10);
        if (isNaN(lastIndex)) lastIndex = -1;
        
        let nextIndex = lastIndex + 1;
        if (nextIndex >= validPosters.length) nextIndex = 0;
        
        currentIndexRef.current = nextIndex;
        setActivePoster(validPosters[nextIndex]);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load welcome screen config", err);
        handleProceed(); // Skip on network error
      }
    };

    fetchConfig();
  }, []);

  useEffect(() => {
    if (!activePoster || loading) return;

    const durationSeconds = config?.posterDurationSeconds || 10;
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
      window.location.href = activePoster.deepLink;
    } else {
      handleProceed();
    }
  };

  if (loading || !activePoster) {
    return <div className="w-full h-[100dvh] bg-black"></div>;
  }

  return (
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden select-none">
      {/* Skip Button */}
      {config?.enableSkipButton !== false && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleProceed();
          }}
          className="absolute top-12 right-6 z-20 px-5 py-2 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white text-sm font-semibold rounded-full uppercase tracking-wider border border-white/20 transition-all cursor-pointer"
        >
          Skip
        </button>
      )}

      {/* Poster Image */}
      <img 
        src={activePoster.imageUrl} 
        alt="Promo"
        className="w-full h-full object-cover cursor-pointer"
        onClick={handlePosterClick}
        onError={() => handleProceed()}
      />
    </div>
  );
}
