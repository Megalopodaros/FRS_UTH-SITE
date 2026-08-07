import React from "react";

interface UthLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export default function UthLogo({ className = "" }: UthLogoProps) {
  return (
    <div className={`inline-flex items-center justify-center cursor-pointer select-none ${className}`}>
      <img 
        src="/radio-logo.png" 
        alt="FRS UTH Radio Logo" 
        className="h-28 md:h-36 w-auto shrink-0 drop-shadow-[0_4px_20px_rgba(183,50,41,0.4)] object-contain transition-transform duration-300 hover:scale-105" 
      />
    </div>
  );
}