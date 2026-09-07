import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cookie } from "lucide-react";

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
        const timer = setTimeout(() => setIsVisible(true), 1000);
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.25 }}
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-[#141416]/92 backdrop-blur-md text-stone-300 px-4 py-2.5 rounded-2xl shadow-xl border border-white/10 flex items-center justify-between gap-3 text-xs"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Cookie className="w-4 h-4 text-[#ad021a] shrink-0" />
          <p className="text-[11px] sm:text-xs text-stone-300 leading-snug">
            {isGreek ? (
              <>
                Μόνο απαραίτητα δεδομένα (ήχος, γλώσσα).{" "}
                <button
                  type="button"
                  onClick={onOpenCookies}
                  className="text-stone-400 hover:text-white underline underline-offset-2 cursor-pointer transition-colors"
                >
                  Πληροφορίες
                </button>
              </>
            ) : (
              <>
                Only essential technical data.{" "}
                <button
                  type="button"
                  onClick={onOpenCookies}
                  className="text-stone-400 hover:text-white underline underline-offset-2 cursor-pointer transition-colors"
                >
                  Learn more
                </button>
              </>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={handleAccept}
          className="px-3 py-1 rounded-xl bg-[#ad021a] hover:bg-[#8f0115] text-white font-bold text-xs shrink-0 cursor-pointer transition-colors shadow-xs"
        >
          {isGreek ? "Εντάξει" : "OK"}
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
