/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, X, AlertCircle } from "lucide-react";
import { verifyAdminPin, isAdminAuthenticated, logoutAdmin } from "../lib/adminService";
import AdminModal from "./AdminModal";
import UthLogo from "./UthLogo";

interface ComingSoonOverlayProps {
  isGreek: boolean;
  onDeactivate: () => Promise<void>;
  onResetComplete?: () => void;
}

export default function ComingSoonOverlay({
  isGreek,
  onDeactivate,
  onResetComplete
}: ComingSoonOverlayProps) {
  const [showPinModal, setShowPinModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isAdmin, setIsAdmin] = useState(() => isAdminAuthenticated());

  const handleShieldClick = () => {
    if (isAdmin) {
      setShowAdminPanel(true);
    } else {
      setShowPinModal(true);
      setPinError("");
      setAdminPin("");
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");
    const ok = verifyAdminPin(adminPin);
    if (ok) {
      setIsAdmin(true);
      setShowPinModal(false);
      setShowAdminPanel(true);
      setAdminPin("");
    } else {
      setPinError(isGreek ? "Λανθασμένος κωδικός διαχειριστή." : "Incorrect admin PIN.");
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    setIsAdmin(false);
    setShowAdminPanel(false);
  };

  const handleToggleComingSoon = async (enabled: boolean) => {
    if (!enabled) {
      await onDeactivate();
      setShowAdminPanel(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#F7F4EC] text-[#1C1917] flex flex-col justify-between overflow-y-auto select-none">
      {/* Subtle warm ambient background glows matching normal site */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[15%] w-[520px] h-[520px] rounded-full bg-[#ad021a]/[0.05] blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[15%] w-[580px] h-[580px] rounded-full bg-[#ad021a]/[0.04] blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#00000005_1px,transparent_1px)] [background-size:24px_24px] opacity-70" />
      </div>

      {/* TOP HEADER: Brand Logo only (Minimal & clean, no top button) */}
      <header className="w-full px-6 py-5 sm:px-10 sm:py-7 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-3">
          <UthLogo size="header" hideTextOnMobile={false} />
        </div>
      </header>

      {/* MAIN CONTENT: Minimalist, Typographic & Cool Center Stage */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10 max-w-2xl mx-auto z-10">
        {/* Pulsing Status Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FCECEE] border border-[#ad021a]/15 text-[#ad021a] text-xs font-bold tracking-wider uppercase mb-6 shadow-2xs"
        >
          <span className="w-2 h-2 rounded-full bg-[#ad021a] animate-ping" />
          <span>{isGreek ? "ΣΥΝΤΟΜΑ ΚΟΝΤΑ ΣΑΣ" : "COMING SOON"}</span>
        </motion.div>

        {/* Minimal Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-[#1C1917] mb-5 font-['Unbounded',sans-serif]"
        >
          FRS <span className="text-[#ad021a]">UTH</span>
        </motion.h1>

        {/* Refined Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-base sm:text-lg md:text-xl text-[#6B6560] font-normal max-w-lg leading-relaxed mb-8"
        >
          {isGreek
            ? "Ο Φοιτητικός Ραδιοφωνικός Σταθμός του Πανεπιστημίου Θεσσαλίας ανανεώνεται. Η νέα ζωντανή πλατφόρμα έρχεται σύντομα!"
            : "The Student Radio Station of the University of Thessaly is being refreshed. The new live broadcast platform is coming soon!"}
        </motion.p>

        {/* Minimalist Soundwave Visualizer Bars in Glass Capsule */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center justify-center gap-1.5 sm:gap-2 h-14 sm:h-16 px-6 py-2.5 rounded-full bg-white/80 border border-black/[0.06] shadow-xs mb-8"
        >
          {[35, 70, 50, 85, 55, 95, 65, 80, 45, 90, 60, 75, 40].map((height, i) => (
            <motion.div
              key={i}
              className="w-1 sm:w-1.5 bg-[#ad021a] rounded-full"
              animate={{
                height: [`${height * 0.25}%`, `${height}%`, `${height * 0.35}%`],
              }}
              transition={{
                duration: 1.1 + (i % 5) * 0.2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
                delay: i * 0.07,
              }}
            />
          ))}
        </motion.div>

        {/* City Footprint */}
        <p className="text-xs font-semibold text-[#8C847C] tracking-widest uppercase">
          {isGreek 
            ? "Βόλος • Λάρισα • Τρίκαλα • Καρδίτσα • Λαμία"
            : "Volos • Larissa • Trikala • Karditsa • Lamia"}
        </p>
      </main>

      {/* MINIMAL FOOTER: With the discreet small shield icon next to University of Thessaly */}
      <footer className="w-full px-6 py-6 text-center text-xs text-[#8C847C] relative z-10 border-t border-black/[0.04]">
        <p className="flex items-center justify-center flex-wrap gap-1">
          <span>© 2026 FRS UTH • Student Radio Station •</span>
          <span className="inline-flex items-center gap-1 text-[#57534E]">
            University of Thessaly
            <button
              type="button"
              onClick={handleShieldClick}
              className="p-1 text-stone-400 hover:text-[#ad021a] transition-colors cursor-pointer rounded-md inline-flex items-center align-middle hover:scale-115 active:scale-95"
              title={isGreek ? "Σύνδεση Διαχειριστή" : "Admin Login"}
              aria-label={isGreek ? "Σύνδεση Διαχειριστή" : "Admin Login"}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </button>
          </span>
        </p>
      </footer>

      {/* ADMIN PIN LOGIN MODAL */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-[10020] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white text-[#1C1917] rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-black/10 relative"
            >
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-[#ad021a] text-white flex items-center justify-center shadow-md shadow-[#ad021a]/25">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1C1917]">
                    {isGreek ? "Σύνδεση Διαχειριστή" : "Admin Authentication"}
                  </h3>
                  <p className="text-xs text-[#78716C]">
                    {isGreek ? "Εισάγετε τον κωδικό PIN" : "Enter the administrator PIN"}
                  </p>
                </div>
              </div>

              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                    {isGreek ? "Κωδικός PIN:" : "PIN Code:"}
                  </label>
                  <input
                    type="password"
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-[#ad021a] focus:ring-2 focus:ring-[#ad021a]/20 transition-all font-mono"
                    autoFocus
                    required
                  />
                </div>

                {pinError && (
                  <div className="flex items-center gap-2 text-xs text-[#ad021a] bg-[#FCECEE] p-2.5 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{pinError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPinModal(false)}
                    className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
                  >
                    {isGreek ? "Ακύρωση" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-[#ad021a] hover:bg-[#8f0115] text-white rounded-full shadow-md transition-all cursor-pointer"
                  >
                    {isGreek ? "Είσοδος" : "Unlock"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADMIN CONTROLS MODAL (When authenticated) */}
      <AdminModal
        isGreek={isGreek}
        isOpen={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
        isComingSoon={true}
        onToggleComingSoon={handleToggleComingSoon}
        onResetComplete={onResetComplete}
        onLogout={handleLogout}
      />
    </div>
  );
}
