import React from "react";
import { ExternalLink, Sparkles } from "lucide-react";
import { AdSpaceConfig } from "../types";

interface AdBannerProps {
  config: AdSpaceConfig | null;
  isGreek: boolean;
}

export default function AdBanner({ config, isGreek }: AdBannerProps) {
  if (!config || !config.enabled) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6">
      <div className="bg-white/70 md:bg-white/55 md:backdrop-blur-md rounded-2xl px-4 py-2.5 sm:px-5 sm:py-2.5 border border-black/[0.06] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs transition-all hover:border-black/15">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 w-full sm:w-auto">
          {config.imageUrl && (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden shrink-0 bg-stone-900 border border-black/10">
              <img
                src={config.imageUrl}
                alt={config.sponsorName || "Sponsor"}
                className="w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }}
              />
            </div>
          )}
          <span className="text-[9.5px] sm:text-[10px] font-mono font-black uppercase tracking-wider text-[#ad021a] bg-[#FCECEE] px-2 py-0.5 rounded-full border border-[#ad021a]/15 shrink-0 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            <span>{config.badge || (isGreek ? "Υποστηρικτής" : "Partner")}</span>
          </span>
          <div className="flex items-center gap-2 min-w-0 truncate text-xs">
            <span className="font-bold text-[#1C1917] truncate">
              {config.sponsorName || (isGreek ? "Υποστηρικτής Σταθμού" : "Station Sponsor")}
            </span>
            {config.text && (
              <span className="text-[#6B6560] hidden sm:inline truncate text-[11px]">
                • {config.text}
              </span>
            )}
          </div>
        </div>

        {config.link && (
          <a
            href={config.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] sm:text-xs font-bold text-[#ad021a] hover:text-[#8f0115] inline-flex items-center gap-1 shrink-0 transition-colors group self-end sm:self-auto"
          >
            <span>{isGreek ? "Επίσκεψη" : "Visit"}</span>
            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        )}
      </div>
    </div>
  );
}
