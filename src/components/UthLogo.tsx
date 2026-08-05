import React from "react";

interface UthLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export default function UthLogo({ className = "w-8 h-8", size = 32, showText = false }: UthLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Official UTH Circular Centaur Chiron Seal Emblem */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 drop-shadow-md"
      >
        {/* Outer Ring */}
        <circle cx="60" cy="60" r="56" stroke="#b73229" strokeWidth="4" fill="#0b0e14" />
        <circle cx="60" cy="60" r="51" stroke="#b73229" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.6" />
        
        {/* Centaur Chiron Silhouette (Official UTH Emblem) */}
        <g fill="#b73229">
          {/* Centaur Body & Horse Rear */}
          <path d="M40 76C32 76 26 70 26 62C26 56 29 50 33 46C31 43 30 38 32 34C34 30 38 27 42 27C44 27 46 28 47 29C49 26 53 24 57 24C62 24 67 27 68 32C71 30 75 30 78 32C82 35 84 40 83 45C86 48 88 52 88 57C88 64 83 70 76 72C73 75 68 76 63 76H40Z" opacity="0.1" />
          
          {/* Detailed Centaur Contour */}
          {/* Human torso */}
          <path d="M60 22C63 22 66 25 66 28C66 31 64 34 62 36L64 48H56L58 36C56 34 54 31 54 28C54 25 57 22 60 22Z" />
          {/* Head & Hair */}
          <circle cx="60" cy="18" r="4.5" />
          {/* Raised Arm holding Staff */}
          <path d="M64 26L74 14L77 16.5L66 30Z" />
          {/* Staff */}
          <line x1="78" y1="10" x2="84" y2="78" stroke="#b73229" strokeWidth="3" strokeLinecap="round" />
          {/* Horse Body */}
          <path d="M35 62C30 62 26 57 26 50C26 44 31 39 37 39H60C64 39 67 42 67 46V54C67 58 64 62 60 62H35Z" />
          {/* Horse Tail */}
          <path d="M27 48C23 52 21 59 23 66C24 68 22 72 20 74C23 72 25 67 25 64C26 58 29 53 30 49L27 48Z" />
          {/* Legs */}
          <rect x="31" y="60" width="4.5" height="24" rx="2" />
          <rect x="42" y="60" width="4.5" height="24" rx="2" />
          <rect x="54" y="60" width="4.5" height="24" rx="2" />
          <rect x="64" y="60" width="4.5" height="24" rx="2" />
          {/* Hooves */}
          <rect x="29" y="81" width="7" height="4" rx="1" fill="#8c231c" />
          <rect x="40" y="81" width="7" height="4" rx="1" fill="#8c231c" />
          <rect x="52.5" y="81" width="7" height="4" rx="1" fill="#8c231c" />
          <rect x="62.5" y="81" width="7" height="4" rx="1" fill="#8c231c" />
        </g>
        
        {/* Border Accent Ring */}
        <circle cx="60" cy="60" r="56" stroke="#b73229" strokeWidth="2" opacity="0.8" />
      </svg>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className="font-serif text-lg font-black tracking-tight text-white flex items-center gap-1">
            <span>FRS</span>
            <span className="text-[#b73229]">UTH</span>
          </span>
          <span className="text-[9px] font-mono font-bold tracking-widest text-on-surface-variant/80 uppercase mt-0.5">
            Πανεπιστήμιο Θεσσαλίας
          </span>
        </div>
      )}
    </div>
  );
}