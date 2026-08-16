import React from "react";

interface UthLogoProps {
  className?: string;
  /** Rendered logo height in px on small screens. */
  size?: number;
  /** Rendered logo height in px from the md breakpoint up. Defaults to 1.25x size. */
  mdSize?: number;
  showText?: boolean;
}

export default function UthLogo({ className = "", size = 40, mdSize }: UthLogoProps) {
  const desktopSize = mdSize ?? Math.round(size * 1.25);

  return (
    <div
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={
        {
          "--logo-h": `${size}px`,
          "--logo-h-md": `${desktopSize}px`
        } as React.CSSProperties
      }
    >
      <img
        src="/radio-logo.png"
        alt="FRS UTH Radio"
        className="uth-logo-img w-auto shrink-0 object-contain drop-shadow-[0_4px_18px_rgba(183,50,41,0.35)] transition-transform duration-300 hover:scale-105"
      />
    </div>
  );
}
