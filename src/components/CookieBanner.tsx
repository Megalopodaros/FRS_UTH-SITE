import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cookie, Check, Info } from "lucide-react";

interface CookieBannerProps {
  isGreek: boolean;
  onOpenCookies: () => void;
}

export default function CookieBanner({ isGreek, onOpenCookies }: CookieBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("frs_cookie_consent");
      if (!consent) {
        // Slight delay so it doesn't pop up abruptly on initial load
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem("frs_cookie_consent", "true");
    } catch {
      // Ignore localStorage errors
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-[#141416]/95 backdrop-blur-md text-stone-200 p-4 sm:p-5 rounded-3xl shadow-2xl border border-white/10 flex flex-col gap-3"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#ad021a]/20 text-[#ad021a] flex items-center justify-center shrink-0 mt-0.5">
            <Cookie className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-xs text-white uppercase tracking-wider mb-1 font-mono">
              {isGreek ? "Απόρρητο & Τοπική Αποθήκευση" : "Privacy & Storage"}
            </h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              {isGreek 
                ? "Χρησιμοποιούμε μόνο τα απαραίτητα τεχνικά δεδομένα τοπικής αποθήκευσης (ένταση ήχου, γλώσσα) χωρίς διαφημίσεις ή tracking."
                : "We only use essential local storage (volume, language) without third-party tracking or advertising cookies."}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/[0.08]">
          <button
            onClick={onOpenCookies}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-stone-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{isGreek ? "Μάθετε περισσότερα" : "Learn more"}</span>
          </button>

          <button
            onClick={handleAccept}
            className="px-4 py-1.5 rounded-full bg-[#ad021a] hover:bg-[#8f0115] text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isGreek ? "Αποδοχή" : "Accept"}</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
