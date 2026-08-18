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
    size === "header" ? "w-12 h-12 sm:w-11 sm:h-11 md:w-12 md:h-12" :
    size === "sm" ? "w-9 h-9" : 
    size === "lg" ? "w-16 h-16 sm:w-20 sm:h-20" : 
    "w-12 h-12 sm:w-12 sm:h-12";

  const titleSizeClass = 
    size === "sm" ? "text-base" : 
    size === "lg" ? "text-2xl" : 
    "text-lg sm:text-xl";

  const subSizeClass = 
    size === "sm" ? "text-[8px]" : 
    size === "lg" ? "text-[11px]" : 
    "text-[9px] sm:text-[10px]";

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Official Circular Logo */}
      <div className={`${iconSizeClass} rounded-full overflow-hidden shrink-0 shadow-md shadow-[#B20710]/25 transition-transform hover:scale-105 border border-black/5 bg-[#A30014]`}>
        <img
          src="/frs-circle-logo.png"
          alt="FRS UTH Campus Radio"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Typography (Hidden on mobile if hideTextOnMobile is true) */}
      {showText && (
        <div className={`flex flex-col text-left leading-none ${hideTextOnMobile ? "hidden sm:flex" : "flex"}`}>
          <span className={`font-black tracking-tight ${titleSizeClass} ${isDark ? "text-white" : "text-[#1C1917]"}`}>
            FRS UTH
          </span>
          <span className={`font-bold tracking-widest mt-1 uppercase ${subSizeClass} text-[#DF3B2B]`}>
            Campus Radio
          </span>
        </div>
      )}
    </div>
  );
}
