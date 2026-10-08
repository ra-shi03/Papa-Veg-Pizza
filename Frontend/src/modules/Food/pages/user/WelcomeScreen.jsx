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

  // Navigate forward based on auth state
  const handleProceed = () => {
    sessionStorage.setItem("papa_veg_welcome_shown", "true");
    
    const isAuthenticated = localStorage.getItem("user_authenticated") === "true";
    if (isAuthenticated) {
      navigate("/food/user", { replace: true });
    } else {
      navigate("/food/user/auth/login", { replace: true });
    }
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
          ?.filter(p => p.isActive)
          ?.filter(p => {
            if (!p.startDate) return true;
            const d = new Date(p.startDate);
            return isNaN(d) || d <= now; // If invalid date, assume valid to prevent hiding
          })
          ?.filter(p => {
            if (!p.endDate) return true;
            const d = new Date(p.endDate);
            return isNaN(d) || d >= now;
          })
          ?.sort((a, b) => (a.order || 0) - (b.order || 0)) || [];

        // Fallback to legacy hero image or a hardcoded default if no dynamic posters exist
        if (validPosters.length === 0) {
          console.log("No valid posters found! Raw posters:", data?.posters);
          validPosters = [{
            id: "fallback",
            imageUrl: data.heroMediaUrl || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80",
            order: 0,
            isActive: true
          }];
        }

        // Determine which poster to show
                // Debugging logs
        console.log("Raw posters from API:", data?.posters);
        console.log("Valid posters after filter:", validPosters);
        let lastIndex = parseInt(localStorage.getItem("lastShownPosterIndex"), 10);
        console.log("Read lastIndex from localStorage:", lastIndex);
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
            // Second run in Strict Mode, don't increment
            nextIndex = isNaN(lastIndex) ? 0 : lastIndex;
          }
        }
        
                console.log("Setting nextIndex to localStorage:", nextIndex);
        localStorage.setItem("lastShownPosterIndex", nextIndex.toString());
        
        currentIndexRef.current = nextIndex;
        setActivePoster(validPosters[nextIndex]);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load welcome screen config", err);
        alert("API Error: " + err.message);
        // Fallback on network error instead of skipping
        setConfig({});
        setActivePoster({
          id: "fallback_error",
          imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80",
          isActive: true
        });
        setLoading(false);
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
