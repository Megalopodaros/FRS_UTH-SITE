import React from "react";

interface UthLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export default function UthLogo({ className = "", size = 36, showText = false }: UthLogoProps) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <img 
        src="/radio-logo.png" 
        alt="FRS UTH Radio Logo" 
        className="h-10 w-auto shrink-0 drop-shadow-sm object-contain" 
      />

      {showText && (
        <div className="flex flex-col justify-center leading-none select-none">
          <div className="font-serif text-xl font-black tracking-tight flex items-center gap-1">
            <span className="text-white">FRS</span>
            <span className="text-[#b73229]">UTH</span>
          </div>
          <span className="text-[10px] font-sans font-bold tracking-wider text-[#94a3b8] uppercase mt-0.5">
            ΠΑΝΕΠΙΣΤΗΜΙΟ ΘΕΣΣΑΛΙΑΣ
          </span>
        </div>
      )}
    </div>
  );
}