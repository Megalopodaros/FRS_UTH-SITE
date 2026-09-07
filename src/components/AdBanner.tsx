import React from "react";
import { ExternalLink, Sparkles, Megaphone } from "lucide-react";
import { AdSpaceConfig } from "../types";

interface AdBannerProps {
  config: AdSpaceConfig | null;
  isGreek: boolean;
}

export default function AdBanner({ config, isGreek }: AdBannerProps) {
  if (!config || !config.enabled) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-white/95 via-stone-50/90 to-[#ad021a]/[0.05] border border-black/[0.08] shadow-sm hover:shadow-md transition-all duration-300 p-5 sm:p-6">
        {/* Subtle vibrant ambient glows */}
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-[#ad021a]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
          {/* Main Visual & Info Block */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-4 sm:gap-5 min-w-0 w-full md:w-auto text-center sm:text-left">
            {/* Prominent Sponsor Image / Visual */}
            {config.imageUrl ? (
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-28 rounded-2xl overflow-hidden shrink-0 shadow-md border border-black/10 group bg-stone-900">
                <img
                  src={config.imageUrl}
                  alt={config.sponsorName || "Sponsor"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
              </div>
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#ad021a] to-[#8f0115] flex items-center justify-center shrink-0 text-white shadow-md">
                <Sparkles className="w-8 h-8" />
              </div>
            )}

            {/* Sponsor Text Details */}
            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10.5px] font-mono font-black uppercase tracking-wider bg-[#ad021a] text-white shadow-xs">
                  <Sparkles className="w-3 h-3 animate-pulse" />
                  <span>{config.badge || (isGreek ? "Επίσημος Χορηγός" : "Official Sponsor")}</span>
                </span>
                <span className="text-[10.5px] font-mono uppercase tracking-wider text-stone-400 font-semibold flex items-center gap-1">
                  <Megaphone className="w-3 h-3" />
                  <span>{isGreek ? "Συνεργάτης Σταθμού" : "Station Partner"}</span>
                </span>
              </div>

              <h3 className="text-lg sm:text-xl md:text-2xl font-display font-black text-[#1C1917] tracking-tight hover:text-[#ad021a] transition-colors line-clamp-1">
                {config.sponsorName || (isGreek ? "Χορηγός Σταθμού" : "Station Sponsor")}
              </h3>

              {config.text && (
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-2xl line-clamp-2">
                  {config.text}
                </p>
              )}
            </div>
          </div>

          {/* Right / CTA Action Button */}
          {config.link && (
            <div className="shrink-0 w-full sm:w-auto flex justify-center md:justify-end">
              <a
                href={config.link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#ad021a] hover:bg-[#8f0115] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all transform active:scale-95 group cursor-pointer"
              >
                <span>{config.ctaText || (isGreek ? "Επίσκεψη" : "Visit")}</span>
                <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
