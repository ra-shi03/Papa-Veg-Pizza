import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocationStore } from "@food/store/locationStore";
import axiosInstance from "@/services/api/axios";
import logoNew from "@/assets/logo1.png";
import pizzaImg from "@/assets/hero-pizza.png";
import pizzaIcon from "@/assets/pizza-icon.png";

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const { clearLocation } = useLocationStore();
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem("sa_logo") || logoNew);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const linkFonts = document.createElement("link");
    linkFonts.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap";
    linkFonts.rel = "stylesheet";
    document.head.appendChild(linkFonts);
    
    const handleBrandingSync = () => {
      setLogoUrl(localStorage.getItem("sa_logo") || logoNew);
    };
    window.addEventListener("systemThemeChanged", handleBrandingSync);

    // Fetch dynamic config
    axiosInstance.get('/settings/welcome')
      .then(res => {
        if (res.data?.data) {
          setConfig(res.data.data);
        }
      })
      .catch(err => console.error("Failed to load welcome screen config", err));

    return () => {
      document.head.removeChild(linkFonts);
      window.removeEventListener("systemThemeChanged", handleBrandingSync);
    };
  }, []);

  const handleSignIn = () => {
    localStorage.setItem("papa_veg_welcome_shown", "true");
    navigate("/user/auth/login");
  };

  const handleContinueAsGuest = () => {
    localStorage.setItem("papa_veg_welcome_shown", "true");
    localStorage.removeItem("user_authenticated");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("user_user");
    localStorage.removeItem("userProfile");
    localStorage.removeItem("appzeto_user_profile");
    localStorage.removeItem("user_accessToken");
    localStorage.removeItem("user_refreshToken");
    localStorage.removeItem("tempPhone");
    localStorage.removeItem("user_temp_phone");
    clearLocation();
    navigate("/food/user");
  };

  const displayLogoUrl = config?.logoUrl || logoUrl;
  const displayMediaUrl = config?.heroMediaUrl || pizzaImg;
  const displayMediaType = config?.heroMediaUrl ? config?.heroMediaType : 'image';
  
  const heading = config?.heading || 'WELCOME TO';
  const subheading = config?.subheading || 'Papa Veg Pizza';
  const description = config?.description || 'Taste the magic of our signature wood-fired crusts, loaded with organic, farm-fresh ingredients!';
  const primaryBtn = config?.primaryButtonText || 'SIGN IN TO UNLOCK OFFERS';
  const secondaryBtn = config?.secondaryButtonText || 'CONTINUE AS GUEST';

  return (
    <div className="w-full h-[100dvh] flex justify-center items-center p-6 bg-[#eeeae5] text-[var(--primary-gray)] font-['Poppins',sans-serif] overflow-hidden max-[700px]:p-0">
      <div className="w-full max-w-[760px] h-full relative overflow-hidden bg-[var(--secondary-off-white)] rounded-[34px] shadow-[0_30px_70px_rgba(0,0,0,0.12),0_10px_30px_rgba(0,0,0,0.06)] max-[700px]:rounded-none max-[700px]:shadow-none flex flex-col">
        
        {/* Decorative shapes */}
        <div className="absolute z-0 pointer-events-none w-[170px] h-[150px] top-0 left-0 bg-[var(--accent-red)] rounded-br-[100%] max-[700px]:w-[100px] max-[700px]:h-[90px]"></div>
        <div className="absolute z-0 pointer-events-none w-[150px] h-[120px] top-0 right-0 bg-[#d8d6d2] rounded-bl-[100%] max-[700px]:w-[90px] max-[700px]:h-[75px]"></div>
        <div className="absolute z-0 pointer-events-none w-[140px] h-[120px] bottom-0 left-0 bg-[var(--accent-red)] rounded-tr-[100%] max-[700px]:w-[90px] max-[700px]:h-[80px]"></div>
        <div className="absolute z-0 pointer-events-none w-[100px] h-[140px] right-[-25px] top-[52%] bg-[var(--accent-red)] rounded-l-[100%] max-[700px]:w-[65px] max-[700px]:h-[90px]"></div>

        {/* Brand & Hero */}
        <div className="relative z-10 flex flex-col justify-center items-center pt-[3vh] max-[700px]:pt-[20px] shrink-0 flex-1 min-h-0 w-full">
          <img src={displayLogoUrl} alt="App Logo" className="w-[90px] h-[90px] object-contain max-[700px]:w-[70px] max-[700px]:h-[70px] shrink-0" />
          
          <div className="relative z-[2] w-full h-full max-h-[45vh] flex justify-center items-center mt-auto overflow-hidden -translate-y-[3vh] max-[700px]:-translate-y-[15px]">
            {displayMediaType === 'video' ? (
              <video src={displayMediaUrl} className="w-full h-full object-cover mix-blend-multiply" autoPlay loop muted playsInline />
            ) : (
              <img src={displayMediaUrl} alt="Hero Media" className="w-full h-full object-cover mix-blend-multiply" />
            )}
          </div>
        </div>

        {/* Content */}
        <main className="relative z-10 px-[70px] pt-0 pb-[4vh] shrink-0 max-[700px]:px-[28px] max-[700px]:pb-[3vh]">
          <div className="flex items-center gap-[12px] text-[18px] font-bold tracking-[5px] text-[var(--muted-gray)] max-[700px]:text-[13px] max-[700px]:tracking-[3px] uppercase">
            <span className="block w-[65px] h-[7px] bg-[var(--accent-red)] rounded-[100px] max-[700px]:w-[45px] max-[700px]:h-[5px]"></span>
            {heading}
          </div>

          <h1 className="mt-[12px] text-[clamp(32px,5vw,52px)] max-[700px]:text-[clamp(28px,10vw,40px)] leading-[0.95] tracking-[-2px] max-[700px]:tracking-[-1px] font-extrabold text-[var(--primary-gray)] m-0">
            {subheading.split(' ').map((word, i, arr) => (
              <React.Fragment key={i}>
                {i === arr.length - 1 ? (
                  <span className="inline-flex items-center gap-[12px]">
                    <span className="text-[var(--accent-red)]">{word}</span>
                    <img src={pizzaIcon} alt="" className="w-[60px] h-[60px] max-[700px]:w-[40px] max-[700px]:h-[40px] rotate-[15deg] object-contain -translate-y-[4px]" />
                  </span>
                ) : (
                  <>{word} {i === arr.length - 2 ? <br /> : ''}</>
                )}
              </React.Fragment>
            ))}
          </h1>

          <p className="max-w-[650px] mt-[20px] max-[700px]:mt-[16px] text-[18px] max-[700px]:text-[14px] leading-[1.5] max-[700px]:leading-[1.5] font-medium text-[var(--muted-gray)] mb-0">
            {description}
          </p>

          {/* CTA */}
          <div className="flex flex-col gap-[14px] mt-[4vh]">
            <button onClick={handleSignIn} className="w-full min-h-[64px] border-none rounded-[100px] flex items-center justify-center text-white bg-[var(--accent-red)] shadow-[0_12px_25px_rgba(237,47,53,0.25)] font-inherit text-[16px] max-[700px]:text-[14px] font-extrabold tracking-[1px] max-[700px]:tracking-[0.7px] cursor-pointer transition-all duration-[250ms] ease hover:bg-[#d9252b] hover:-translate-y-[3px] hover:shadow-[0_18px_30px_rgba(237,47,53,0.30)] p-0 uppercase">
              <span>{primaryBtn}</span>
            </button>

            <button onClick={handleContinueAsGuest} className="w-full min-h-[64px] bg-transparent border-2 border-solid border-[var(--border-gray)] rounded-[100px] text-[var(--primary-gray)] font-inherit text-[16px] max-[700px]:text-[14px] font-extrabold tracking-[1px] max-[700px]:tracking-[0.7px] cursor-pointer transition-all duration-[250ms] ease hover:bg-[#efede9] hover:-translate-y-[2px] hover:border-[#bbb9b5] p-0 uppercase">
              {secondaryBtn}
            </button>
          </div>
        </main>

        {/* Bottom decoration */}
        <img src={pizzaIcon} alt="" className="absolute right-[-15px] bottom-[-20px] w-[130px] h-[130px] object-contain opacity-[0.06] -rotate-[25deg] pointer-events-none" />
      </div>
    </div>
  );
}
