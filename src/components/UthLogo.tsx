import React from "react";

interface UthLogoProps {
  className?: string;
  isDark?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function UthLogo({ className = "", isDark = false, size = "md" }: UthLogoProps) {
  const iconSizeClass = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-12 h-12" : "w-10 h-10";
  const titleSizeClass = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg";
  const subSizeClass = size === "sm" ? "text-[8px]" : size === "lg" ? "text-[10px]" : "text-[9px]";

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Red Circular Icon with Play Symbol */}
      <div className={`${iconSizeClass} rounded-full bg-[#DF3B2B] flex items-center justify-center shadow-md shadow-[#DF3B2B]/20 shrink-0`}>
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          className="w-4 h-4 text-white ml-0.5" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M7 4.5V19.5L19 12L7 4.5Z" 
            fill="currentColor" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Typography */}
      <div className="flex flex-col text-left leading-none">
        <span className={`font-black tracking-tight ${titleSizeClass} ${isDark ? "text-white" : "text-[#1C1917]"}`}>
          FRS UTH
        </span>
        <span className={`font-bold tracking-widest mt-0.5 uppercase ${subSizeClass} text-[#DF3B2B]`}>
          Campus Radio
        </span>
      </div>
    </div>
  );
}
