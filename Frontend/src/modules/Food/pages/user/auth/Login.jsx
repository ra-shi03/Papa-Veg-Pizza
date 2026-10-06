import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { clearModuleAuth } from "@food/utils/auth";
import { requestUserOtp } from "@/services/api/auth";
import axiosInstance from "@/services/api/axios";
import OTP from "./OTP";
import { truecallerMock } from "@/services/truecallerMock";
import logoNew from "@/assets/logo1.png";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTruecallerLoading, setIsTruecallerLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [step, setStep] = useState("phone");
  const [config, setConfig] = useState(null);

  useEffect(() => {
    clearModuleAuth("user");
    localStorage.removeItem("tempPhone");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userProfile");
    localStorage.removeItem("appzeto_user_profile");
    localStorage.removeItem("user_temp_phone");

    axiosInstance.get('/settings/welcome')
      .then(res => {
        if (res.data?.data) {
          setConfig(res.data.data);
        }
      })
      .catch(err => console.error("Failed to load welcome screen config", err));
  }, []);

  const handleTruecallerLogin = async () => {
    if (!truecallerMock.isInstalled()) return;
    
    setIsTruecallerLoading(true);
    try {
      const response = await truecallerMock.requestVerification();
      if (response.successful) {
        // Send payload to backend verify endpoint
        const apiResponse = await axiosInstance.post('/food/auth/user/verify-truecaller', {
          payload: response.payload
        });
        
        if (apiResponse.data?.success) {
          const { tokens, user, isNewUser } = apiResponse.data.data;
          
          localStorage.setItem("user_accessToken", tokens.accessToken);
          localStorage.setItem("user_refreshToken", tokens.refreshToken);
          localStorage.setItem("user_authenticated", "true");
          localStorage.setItem("user_profile", JSON.stringify(user));
          
          window.dispatchEvent(new CustomEvent("authStatusChanged", { detail: { module: "user", status: "login" } }));
          
          if (isNewUser) {
            navigate("/user/location/setup", { replace: true });
          } else {
            navigate(location.state?.from || "/user/location/setup", { replace: true });
          }
        }
      }
    } catch (err) {
      console.error("Truecaller verification failed", err);
      // Fallback silently by just ending loading state
    } finally {
      setIsTruecallerLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (phoneNumber.trim().length < 10) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }
    
    setIsLoading(true);
    const formattedPhone = "+91 " + phoneNumber;

    try {
      await requestUserOtp(formattedPhone);
      
      sessionStorage.setItem("userAuthData", JSON.stringify({
        method: "phone",
        phone: formattedPhone,
        isSignUp: false
      }));

      setTimeout(() => {
        setIsLoading(false);
        setStep("otp");
      }, 500);
    } catch (err) {
      setIsLoading(false);
      alert(err?.response?.data?.message || "Failed to send OTP. Please try again.");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-[100dvh] pb-8 overflow-x-hidden flex flex-col bg-white text-[var(--primary-gray)] relative">
      <main className="flex-1 flex flex-col justify-start p-6 pt-16 max-w-md mx-auto w-full z-10 relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-full flex justify-center mb-8 relative"
        >
          <motion.img 
            src={config?.loginImage || logoNew} 
            alt="Logo" 
            className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-full shadow-2xl border-4 border-white z-10"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
          />
        </motion.div>

        {step === "phone" ? (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0, y: -20 }} className="flex flex-col flex-1">
            <motion.div variants={itemVariants} className="mb-2 text-center">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                {config?.loginHeading || "Welcome Back"}
              </h2>
            </motion.div>

            <motion.div variants={itemVariants} className="mb-10 text-center">
              <p className="text-sm text-gray-500 font-medium px-4">
                {config?.loginDescription || "Log in or sign up to explore exclusive deals and order your favorite pizzas instantly."}
              </p>
            </motion.div>

            {truecallerMock.isInstalled() && config?.enableTruecaller !== false && (
              <motion.div variants={itemVariants} className="mb-6 w-full">
                <button
                  type="button"
                  onClick={handleTruecallerLogin}
                  disabled={isTruecallerLoading}
                  className="w-full h-14 bg-[var(--accent-red)] text-white font-bold rounded-xl text-[16px] tracking-wide cursor-pointer transition-all border-0 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
                >
                  {isTruecallerLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Continue with Truecaller"
                  )}
                </button>
              </motion.div>
            )}

            {truecallerMock.isInstalled() && config?.enableTruecaller !== false && (
              <motion.div variants={itemVariants} className="flex items-center w-full mb-6">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-4 text-sm text-gray-400 font-medium">or</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </motion.div>
            )}

            <motion.form variants={itemVariants} onSubmit={handleLogin} className="space-y-6 relative w-full">
              <div className={`flex items-center border-2 rounded-xl px-4 py-1.5 transition-all duration-300 ${isFocused ? 'border-gray-800 bg-white' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center gap-2 pr-3 border-r border-gray-300 select-none py-2">
                  <span className="text-sm font-bold text-gray-700">+91</span>
                </div>
                <input
                  type="tel"
                  maxLength="10"
                  placeholder="Mobile number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="flex-1 pl-3 bg-transparent text-base font-semibold outline-none border-none text-gray-800 placeholder-gray-400 w-full"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || phoneNumber.length < 10}
                className={`w-full h-14 font-bold rounded-xl text-[16px] tracking-wide cursor-pointer transition-all border-0 flex items-center justify-center gap-2 ${phoneNumber.length === 10 ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Send OTP"
                )}
              </button>
            </motion.form>
            
            <div className="flex-1"></div>
          </motion.div>
        ) : (
          <OTP />
        )}
        
        {step === "phone" && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center text-[11px] text-gray-400 mt-8 font-medium px-4">
            By continuing, you agree to our <br/>
            <a href="#" className="text-gray-600 underline decoration-gray-300 underline-offset-2">Terms of Service</a> & <a href="#" className="text-gray-600 underline decoration-gray-300 underline-offset-2">Privacy Policy</a>
          </motion.p>
        )}

        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              className="absolute -inset-8 bg-white/80 z-20 flex flex-col items-center justify-center rounded-[2rem] gap-4"
            >
              <div className="relative">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="w-20 h-20 border-4 border-[var(--accent-red)] border-t-transparent border-dashed rounded-full"
                />
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center text-4xl"
                  animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                >
                  🍕
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
