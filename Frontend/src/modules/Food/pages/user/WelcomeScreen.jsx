import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/services/api/axios";
import heroPizza from "@/assets/hero-pizza.png";
import loginPizza from "@/assets/login-pizza.jpg";
import logoImg from "@/assets/logo1.png";

export default function WelcomeScreen() {
  const navigate = useNavigate();
  
  const [config, setConfig] = useState(null);
  // Default immediately to bundled high-res poster so there is NEVER a black flash or skipped state
  const [activePoster, setActivePoster] = useState({
    id: "default_welcome",
    imageUrl: heroPizza,
    isActive: true
  });
  
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
        
        if (!data) return;

        setConfig(data);
        
        const now = new Date();
        let validPosters = data.posters
          ?.filter(p => p.isActive && p.imageUrl)
          ?.filter(p => {
            if (!p.startDate) return true;
            const d = new Date(p.startDate);
            return isNaN(d) || d <= now;
          })
          ?.filter(p => {
            if (!p.endDate) return true;
            const d = new Date(p.endDate);
            return isNaN(d) || d >= now;
          })
          ?.sort((a, b) => (a.order || 0) - (b.order || 0)) || [];

        if (validPosters.length > 0) {
          let lastIndex = parseInt(localStorage.getItem("lastShownPosterIndex"), 10);
          let nextIndex = 0;
          
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
          
          localStorage.setItem("lastShownPosterIndex", nextIndex.toString());
          currentIndexRef.current = nextIndex;
          setActivePoster(validPosters[nextIndex]);
        }
      } catch (err) {
        console.warn("Failed to load dynamic welcome posters, using default", err);
      }
    };

    fetchConfig();
  }, []);

  // Timer to proceed to login after configured duration
  useEffect(() => {
    const durationSeconds = config?.posterDurationSeconds || 5;
    const durationMs = durationSeconds * 1000;

    timerRef.current = setTimeout(() => {
      handleProceed();
    }, durationMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activePoster, config]);

  const handlePosterClick = () => {
    if (activePoster?.deepLink) {
      window.location.href = activePoster.deepLink;
    } else {
      handleProceed();
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#0c0c0e] overflow-hidden select-none flex flex-col justify-between">
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-5 pt-8 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-2">
          <img src={logoImg} alt="Papa Veg Pizza" className="h-9 w-auto object-contain drop-shadow-md" />
        </div>

        {/* Skip Button */}
        {config?.enableSkipButton !== false && (
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleProceed();
            }}
            className="px-4 py-1.5 bg-white/20 hover:bg-white/30 active:scale-95 backdrop-blur-md text-white text-xs font-bold rounded-full uppercase tracking-wider border border-white/30 transition-all cursor-pointer shadow-lg"
          >
            Skip &rarr;
          </button>
        )}
      </div>

      {/* Poster Media / Background */}
      <div 
        className="w-full h-full flex items-center justify-center cursor-pointer relative"
        onClick={handlePosterClick}
      >
        <img 
          src={activePoster.imageUrl || heroPizza} 
          alt="Welcome"
          className="w-full h-full object-cover object-center"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = loginPizza;
          }}
        />

        {/* Dark bottom gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />
      </div>

      {/* Bottom Action Section */}
      <div className="absolute bottom-0 left-0 right-0 z-30 p-6 pb-10 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col items-center max-w-md mx-auto w-full">
        <h2 className="text-white text-xl sm:text-2xl font-extrabold text-center tracking-tight mb-1" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
          {config?.heading || "Welcome to Papa Veg Pizza"}
        </h2>
        <p className="text-zinc-300 text-xs sm:text-sm text-center mb-5 max-w-xs leading-relaxed">
          {config?.description || "Delicious handcrafted 100% vegetarian pizzas right to your doorstep."}
        </p>

        {/* Get Started Button (strictly goes to Login) */}
        <button
          type="button"
          onClick={handleProceed}
          className="w-full py-3.5 bg-[#EE3A43] hover:bg-[#d92d36] text-white font-bold text-sm sm:text-base rounded-2xl shadow-xl shadow-red-600/30 active:scale-[0.98] transition-all cursor-pointer border-0 flex items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--accent-red, #EE3A43)', color: '#ffffff' }}
        >
          <span>Get Started</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
