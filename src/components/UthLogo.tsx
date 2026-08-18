import React from "react";

interface UthLogoProps {
  className?: string;
  isDark?: boolean;
  size?: "sm" | "md" | "lg" | "header";
  showText?: boolean;
  hideTextOnMobile?: boolean;
}

export default function UthLogo({
  className = "",
  isDark = false,
  size = "md",
  showText = true,
  hideTextOnMobile = false
}: UthLogoProps) {
  const iconSizeClass = 
    size === "header" ? "w-10 h-10 sm:w-9 sm:h-9 md:w-10 md:h-10" :
    size === "sm" ? "w-8 h-8" : 
    size === "lg" ? "w-16 h-16 sm:w-20 sm:h-20" : 
    "w-11 h-11 sm:w-12 sm:h-12";

  const titleSizeClass = 
    size === "header" ? "text-base sm:text-lg" :
    size === "sm" ? "text-sm" : 
    size === "lg" ? "text-2xl" : 
    "text-lg sm:text-xl";

  const subSizeClass = 
    size === "header" ? "text-[8px] sm:text-[9px]" :
    size === "sm" ? "text-[8px]" : 
    size === "lg" ? "text-[11px]" : 
    "text-[9px] sm:text-[10px]";

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Official Circular Logo */}
      <div className={`${iconSizeClass} rounded-full overflow-hidden shrink-0 shadow-sm shadow-[#B20710]/20 transition-transform hover:scale-105 border border-black/5 bg-[#A30014]`}>
        <img
          src="/frs-circle-logo.png"
          alt="FRS UTH Campus Radio"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Typography (Hidden on mobile if hideTextOnMobile is true) */}
      {showText && (
        <div className={`flex flex-col text-left leading-none ${hideTextOnMobile ? "hidden sm:flex" : "flex"}`}>
          <span className={`font-display font-black tracking-tight ${titleSizeClass} ${isDark ? "text-white" : "text-[#1C1917]"}`}>
            FRS UTH
          </span>
          <span className={`font-grotesk font-extrabold tracking-widest mt-0.5 uppercase ${subSizeClass} text-[#DF3B2B]`}>
            Campus Radio
          </span>
        </div>
      )}
    </div>
  );
}
