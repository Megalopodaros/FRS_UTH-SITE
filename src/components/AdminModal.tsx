/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  X, 
  Trash2, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  LogOut,
  Radio,
  Eye,
  EyeOff
} from "lucide-react";
import { resetChatAndPolls } from "../lib/adminService";

interface AdminModalProps {
  isGreek: boolean;
  isOpen: boolean;
  onClose: () => void;
  isComingSoon: boolean;
  onToggleComingSoon: (enabled: boolean) => Promise<void>;
  onResetComplete?: () => void;
  onLogout: () => void;
}

export default function AdminModal({
  isGreek,
  isOpen,
  onClose,
  isComingSoon,
  onToggleComingSoon,
  onResetComplete,
  onLogout
}: AdminModalProps) {
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isTogglingComingSoon, setIsTogglingComingSoon] = useState(false);

  if (!isOpen) return null;

  const handleResetExecute = async () => {
    setIsResetting(true);
    setResetSuccess(null);
    setResetError(null);
    try {
      const { messagesDeleted } = await resetChatAndPolls();
      setShowResetConfirm(false);
      setResetSuccess(
        isGreek 
          ? `Επιτυχής επαναφορά! Διαγράφηκαν ${messagesDeleted} μηνύματα και μηδενίστηκαν τα polls.`
          : `Reset successful! Deleted ${messagesDeleted} messages and cleared polls.`
      );
      if (onResetComplete) {
        onResetComplete();
      }
      setTimeout(() => {
        setResetSuccess(null);
      }, 5000);
    } catch (err: any) {
      setResetError(
        isGreek 
          ? "Σφάλμα κατά την επαναφορά. Παρακαλώ δοκιμάστε ξανά."
          : "Error during reset. Please try again."
      );
    } finally {
      setIsResetting(false);
    }
  };

  const handleToggleMode = async () => {
    setIsTogglingComingSoon(true);
    setResetSuccess(null);
    setResetError(null);
    try {
      const targetState = !isComingSoon;
      await onToggleComingSoon(targetState);
      setResetSuccess(
        targetState
          ? (isGreek ? "Η οθόνη Coming Soon ενεργοποιήθηκε για όλους τους επισκέπτες!" : "Coming Soon screen activated for all visitors!")
          : (isGreek ? "Η οθόνη Coming Soon απενεργοποιήθηκε επιτυχώς!" : "Coming Soon screen deactivated successfully!")
      );
      setTimeout(() => setResetSuccess(null), 4000);
    } catch (err: any) {
      console.error("Failed to toggle coming soon mode:", err);
      setResetError(
        isGreek 
          ? `Σφάλμα: ${err?.message || "Αποτυχία ενημέρωσης κατάστασης"}`
          : `Error: ${err?.message || "Failed to update status"}`
      );
    } finally {
      setIsTogglingComingSoon(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10010] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-black/10 relative overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#78716C] hover:text-[#1C1917] p-1.5 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
          title={isGreek ? "Κλείσιμο" : "Close"}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#ad021a] text-white flex items-center justify-center font-bold shadow-md shadow-[#ad021a]/25 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-[#1C1917]">
                {isGreek ? "Πίνακας Διαχειριστή" : "Admin Dashboard"}
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#FCECEE] text-[#ad021a] border border-[#ad021a]/20 px-2 py-0.5 rounded-md">
                ADMIN
              </span>
            </div>
            <p className="text-xs text-[#78716C]">
              {isGreek ? "Διαχείριση FRS UTH & Έλεγχος Συστήματος" : "FRS UTH System & Broadcast Controls"}
            </p>
          </div>
        </div>

        {/* Feedback Alerts */}
        <AnimatePresence>
          {resetSuccess && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-2xl flex items-center gap-2 font-medium"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{resetSuccess}</span>
            </motion.div>
          )}

          {resetError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-2xl flex items-center gap-2 font-medium"
            >
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{resetError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          {/* OPTION 1: COMING SOON SCREEN TOGGLE */}
          <div className="bg-[#FAF8F4] border border-stone-200/80 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isComingSoon ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-700"
                }`}>
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1C1917]">
                    {isGreek ? "Οθόνη Coming Soon" : "Coming Soon Screen"}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${
                      isComingSoon ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                    }`} />
                    <span className="text-[11px] font-semibold text-[#78716C]">
                      {isComingSoon 
                        ? (isGreek ? "Ενεργή για όλους" : "Active for all visitors")
                        : (isGreek ? "Ανενεργή (Κανονική λειτουργία)" : "Inactive (Normal site mode)")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-[#78716C] mb-3 leading-relaxed">
              {isComingSoon
                ? (isGreek 
                    ? "Όλοι οι επισκέπτες βλέπουν την οθόνη αναμονής. Πατήστε για επαναφορά του ιστότοπου."
                    : "All visitors are seeing the Coming Soon screen. Click to restore normal site.")
                : (isGreek 
                    ? "Εμφάνιση καθολικής οθόνης Coming Soon σε όλους τους επισκέπτες του σταθμού."
                    : "Display a site-wide Coming Soon screen to all station visitors.")}
            </p>

            <button
              onClick={handleToggleMode}
              disabled={isTogglingComingSoon}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                isComingSoon
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-[#1C1917] hover:bg-[#2C2724] text-white"
              }`}
            >
              {isTogglingComingSoon ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isComingSoon ? (
                <>
                  <Eye className="w-4 h-4" />
                  <span>{isGreek ? "Απενεργοποίηση Coming Soon" : "Disable Coming Soon"}</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>{isGreek ? "Ενεργοποίηση Coming Soon" : "Enable Coming Soon"}</span>
                </>
              )}
            </button>
          </div>

          {/* OPTION 2: RESET CHAT & POLLS */}
          <div className="bg-[#FAF8F4] border border-stone-200/80 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-red-100 text-[#ad021a] flex items-center justify-center">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1C1917]">
                  {isGreek ? "Επαναφορά Chat & Polls" : "Reset Chat & Polls"}
                </h4>
                <p className="text-[11px] text-[#78716C]">
                  {isGreek ? "Πλήρης καθαρισμός ιστορικού μηνυμάτων & ψηφοφορίας" : "Clear all chat messages & active poll"}
                </p>
              </div>
            </div>

            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-[#FCECEE] hover:bg-[#fbdde1] text-[#ad021a] border border-[#ad021a]/20 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isGreek ? "Εκκαθάριση Όλων των Μηνυμάτων & Polls" : "Clear All Messages & Polls"}</span>
              </button>
            ) : (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl space-y-2.5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold text-red-900 leading-snug">
                    {isGreek
                      ? "Προσοχή: Αυτή η ενέργεια θα διαγράψει οριστικά όλα τα μηνύματα του chat και την τρέχουσα ψηφοφορία."
                      : "Warning: This action will permanently delete all chat messages and current poll."}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    disabled={isResetting}
                    className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    {isGreek ? "Ακύρωση" : "Cancel"}
                  </button>
                  <button
                    onClick={handleResetExecute}
                    disabled={isResetting}
                    className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    {isResetting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isGreek ? "Ναι, Διαγραφή" : "Yes, Delete"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer / Logout */}
        <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-red-700 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{isGreek ? "Αποσύνδεση Διαχειριστή" : "Logout Admin"}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-full transition-colors cursor-pointer"
          >
            {isGreek ? "Κλείσιμο" : "Done"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
