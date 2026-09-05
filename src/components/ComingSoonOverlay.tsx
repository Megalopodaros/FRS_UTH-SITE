/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Radio, X, AlertCircle, Sparkles, Volume2 } from "lucide-react";
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
    <div className="fixed inset-0 z-[9999] bg-[#0D0B0B] text-white flex flex-col justify-between overflow-y-auto select-none">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-15%] left-[20%] w-[550px] h-[550px] rounded-full bg-[#ad021a]/15 blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] rounded-full bg-[#ad021a]/10 blur-[160px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
      </div>

      {/* TOP BAR: Logo & Shield Button */}
      <header className="w-full px-6 py-5 sm:px-10 sm:py-6 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <UthLogo size="header" hideTextOnMobile={false} />
          </div>
        </div>

        {/* TOP-RIGHT SHIELD ICON BUTTON (Required mechanism to unlock & deactivate) */}
        <button
          type="button"
          onClick={handleShieldClick}
          className="p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white shadow-lg backdrop-blur-md transition-all cursor-pointer hover:scale-105 active:scale-95"
          title={isGreek ? "Σύνδεση Διαχειριστή" : "Admin Login"}
          aria-label={isGreek ? "Σύνδεση Διαχειριστή" : "Admin Login"}
        >
          <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff4b62]" />
        </button>
      </header>

      {/* MAIN CONTENT: Centered Hero Display */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12 max-w-3xl mx-auto z-10">
        {/* Pulsing Status Pill */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ad021a]/20 border border-[#ad021a]/40 text-[#ff4b62] text-xs sm:text-sm font-bold tracking-wider uppercase mb-6 shadow-sm shadow-[#ad021a]/20"
        >
          <span className="w-2 h-2 rounded-full bg-[#ad021a] animate-ping" />
          <span>{isGreek ? "ΣΥΝΤΟΜΑ ΚΟΝΤΑ ΣΑΣ" : "COMING SOON"}</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white mb-6 leading-[1.1]"
        >
          FRS <span className="text-[#ff3b53]">UTH</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-xl text-stone-300 font-medium max-w-xl leading-relaxed mb-8"
        >
          {isGreek
            ? "Ο Φοιτητικός Ραδιοφωνικός Σταθμός του Πανεπιστημίου Θεσσαλίας ανανεώνεται. Το νέο μας web radio και η ζωντανή πλατφόρμα ετοιμάζονται!"
            : "The Student Radio Station of the University of Thessaly is preparing a brand new digital experience. Stay tuned!"}
        </motion.p>

        {/* Dynamic Soundwave Visualizer Bars */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex items-center justify-center gap-1.5 sm:gap-2 h-16 sm:h-20 mb-8 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"
        >
          {[40, 75, 55, 90, 60, 100, 70, 85, 45, 95, 65, 80, 50].map((height, i) => (
            <motion.div
              key={i}
              className="w-1.5 sm:w-2 bg-gradient-to-t from-[#ad021a] to-[#ff4b62] rounded-full"
              animate={{
                height: [`${height * 0.3}%`, `${height}%`, `${height * 0.4}%`],
              }}
              transition={{
                duration: 1.2 + (i % 5) * 0.2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
                delay: i * 0.08,
              }}
            />
          ))}
        </motion.div>

        {/* City Footprint */}
        <p className="text-xs sm:text-sm text-stone-400 font-medium tracking-wide">
          {isGreek 
            ? "Βόλος • Λάρισα • Τρίκαλα • Καρδίτσα • Λαμία"
            : "Volos • Larissa • Trikala • Karditsa • Lamia"}
        </p>
      </main>

      {/* FOOTER */}
      <footer className="w-full px-6 py-6 text-center text-xs text-stone-400 relative z-10 border-t border-white/5">
        <p>© 2026 FRS UTH • Student Radio Station • University of Thessaly</p>
      </footer>

      {/* ADMIN PIN LOGIN MODAL */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-[10020] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
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
                <div className="w-11 h-11 rounded-2xl bg-[#ad021a] text-white flex items-center justify-center shadow-md shadow-[#ad021a]/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1C1917]">
                    {isGreek ? "Σύνδεση Διαχειριστή" : "Admin Authentication"}
                  </h3>
                  <p className="text-xs text-[#78716C]">
                    {isGreek ? "Εισάγετε τον κωδικό διαχειριστή" : "Enter the administrator PIN"}
                  </p>
                </div>
              </div>

              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                    {isGreek ? "Κωδικός Admin PIN:" : "Admin PIN Code:"}
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
