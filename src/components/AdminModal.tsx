/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  EyeOff,
  Users,
  Calendar,
  Sparkles,
  Plus,
  Edit2,
  Mail,
  Phone,
  RotateCcw,
  Save,
  RefreshCw
} from "lucide-react";
import { resetChatAndPolls } from "../lib/adminService";
import { 
  subscribeToCustomSchedule, 
  saveCustomSchedule, 
  resetCustomSchedule,
  subscribeToCustomEvents, 
  saveCustomEvents, 
  resetCustomEvents,
  fetchOpenCallApplications, 
  deleteOpenCallApplication,
  getCachedCustomSchedule,
  getCachedCustomEvents,
  sortShowsByTime,
  sortScheduleShows
} from "../lib/contentService";
import { WEEKLY_SCHEDULE_GR, DEFAULT_EVENTS_GR, SHOWS_DESCRIPTIONS_GR } from "../data/radioData";
import { DayProgram, Show, StationEvent, OpenCallApplication } from "../types";

// Helper to guarantee every show in draft has its rich description synchronized and is sorted chronologically
const syncShowsWithDescriptions = (days: DayProgram[]): DayProgram[] => {
  return sortScheduleShows(days.map(day => ({
    ...day,
    shows: day.shows.map(show => {
      if (show.description && show.description.trim()) {
        return show;
      }
      const found = SHOWS_DESCRIPTIONS_GR.find(
        d => d.id === show.id || d.title.trim().toLowerCase() === show.title.trim().toLowerCase()
      );
      return {
        ...show,
        description: found?.description || show.description || ""
      };
    })
  })));
};

type AdminTab = "status" | "applications" | "schedule" | "events";

interface AdminModalProps {
  isGreek: boolean;
  isOpen: boolean;
  onClose: () => void;
  isComingSoon: boolean;
  onToggleComingSoon: (enabled: boolean) => Promise<void>;
  onResetComplete?: () => void;
  onLogout: () => void;
}

const SCHEDULE_DAYS = [
  { key: "Δευ", labelGr: "Δευτέρα", labelEn: "Monday" },
  { key: "Τρι", labelGr: "Τρίτη", labelEn: "Tuesday" },
  { key: "Τετ", labelGr: "Τετάρτη", labelEn: "Wednesday" },
  { key: "Πεμ", labelGr: "Πέμπτη", labelEn: "Thursday" },
  { key: "Παρ", labelGr: "Παρασκευή", labelEn: "Friday" },
  { key: "Σαβ", labelGr: "Σάββατο", labelEn: "Saturday" },
  { key: "Κυρ", labelGr: "Κυριακή", labelEn: "Sunday" }
];

export default function AdminModal({
  isGreek,
  isOpen,
  onClose,
  isComingSoon,
  onToggleComingSoon,
  onResetComplete,
  onLogout
}: AdminModalProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("status");
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Status Tab state
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isTogglingComingSoon, setIsTogglingComingSoon] = useState(false);

  // Applications Tab state
  const [applications, setApplications] = useState<OpenCallApplication[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [deletingAppId, setDeletingAppId] = useState<string | null>(null);

  // Schedule Tab state
  const [scheduleDraft, setScheduleDraft] = useState<DayProgram[]>(() => 
    syncShowsWithDescriptions(getCachedCustomSchedule() || JSON.parse(JSON.stringify(WEEKLY_SCHEDULE_GR)))
  );
  const [selectedDayKey, setSelectedDayKey] = useState("Δευ");
  const [editingShow, setEditingShow] = useState<{ isNew: boolean; show: Show } | null>(null);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [isResettingSchedule, setIsResettingSchedule] = useState(false);

  // Events Tab state
  const [eventsDraft, setEventsDraft] = useState<StationEvent[]>(() => {
    const cached = getCachedCustomEvents();
    if (cached !== null && Array.isArray(cached)) return cached;
    return JSON.parse(JSON.stringify(DEFAULT_EVENTS_GR));
  });
  const [editingEvent, setEditingEvent] = useState<{ isNew: boolean; event: StationEvent } | null>(null);
  const [isSavingEvents, setIsSavingEvents] = useState(false);
  const [isResettingEvents, setIsResettingEvents] = useState(false);

  // Subscribe to live custom schedule and events when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const unsubSchedule = subscribeToCustomSchedule((custom) => {
      if (custom && custom.length > 0) {
        setScheduleDraft(syncShowsWithDescriptions(custom));
      } else {
        setScheduleDraft(syncShowsWithDescriptions(JSON.parse(JSON.stringify(WEEKLY_SCHEDULE_GR))));
      }
    });

    const unsubEvents = subscribeToCustomEvents((custom) => {
      if (custom !== null && Array.isArray(custom)) {
        setEventsDraft(custom);
      } else {
        setEventsDraft(JSON.parse(JSON.stringify(DEFAULT_EVENTS_GR)));
      }
    });

    return () => {
      unsubSchedule();
      unsubEvents();
    };
  }, [isOpen]);

  // Load applications when switching to applications tab or when modal opens
  const loadApplications = async () => {
    setIsLoadingApps(true);
    try {
      const data = await fetchOpenCallApplications();
      setApplications(data);
    } catch (err: any) {
      console.error("Failed to load applications:", err);
      setFeedbackError(isGreek ? "Αποτυχία φόρτωσης αιτήσεων." : "Failed to load applications.");
    } finally {
      setIsLoadingApps(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === "applications") {
      loadApplications();
    }
  }, [isOpen, activeTab]);

  const showNotification = (successMsg?: string, errorMsg?: string) => {
    if (successMsg) {
      setFeedbackSuccess(successMsg);
      setTimeout(() => setFeedbackSuccess(null), 4000);
    }
    if (errorMsg) {
      setFeedbackError(errorMsg);
      setTimeout(() => setFeedbackError(null), 5000);
    }
  };

  if (!isOpen) return null;

  // --- ACTIONS: STATUS ---
  const handleResetExecute = async () => {
    setIsResetting(true);
    try {
      const { messagesDeleted } = await resetChatAndPolls();
      setShowResetConfirm(false);
      showNotification(
        isGreek 
          ? `Επιτυχής επαναφορά! Διαγράφηκαν ${messagesDeleted} μηνύματα και μηδενίστηκαν τα polls.`
          : `Reset successful! Deleted ${messagesDeleted} messages and cleared polls.`
      );
      onResetComplete?.();
    } catch (err: any) {
      showNotification(undefined, isGreek ? "Σφάλμα κατά την επαναφορά." : "Error during reset.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleToggleMode = async () => {
    setIsTogglingComingSoon(true);
    try {
      const targetState = !isComingSoon;
      await onToggleComingSoon(targetState);
      showNotification(
        targetState
          ? (isGreek ? "Η οθόνη Coming Soon ενεργοποιήθηκε!" : "Coming Soon screen activated!")
          : (isGreek ? "Η οθόνη Coming Soon απενεργοποιήθηκε!" : "Coming Soon screen deactivated!")
      );
    } catch (err: any) {
      showNotification(undefined, err?.message || "Error updating mode");
    } finally {
      setIsTogglingComingSoon(false);
    }
  };

  // --- ACTIONS: APPLICATIONS ---
  const handleDeleteApplication = async (appId: string) => {
    setDeletingAppId(appId);
    try {
      await deleteOpenCallApplication(appId);
      setApplications(prev => prev.filter(a => a.id !== appId));
      showNotification(isGreek ? "Η αίτηση διαγράφηκε επιτυχώς." : "Application deleted successfully.");
    } catch (err) {
      showNotification(undefined, isGreek ? "Αποτυχία διαγραφής αίτησης." : "Failed to delete application.");
    } finally {
      setDeletingAppId(null);
    }
  };

  // --- ACTIONS: SCHEDULE ---
  const rawDayProgram = scheduleDraft.find(d => d.day === selectedDayKey) || {
    day: selectedDayKey,
    shows: []
  };
  const currentDayProgram = {
    ...rawDayProgram,
    shows: sortShowsByTime(rawDayProgram.shows || [])
  };

  const handleSaveShowDraft = () => {
    if (!editingShow) return;
    const { isNew, show } = editingShow;
    if (!show.title.trim() || !show.time.trim() || !show.description?.trim()) {
      showNotification(
        undefined, 
        isGreek 
          ? "Συμπληρώστε τίτλο, ώρα και περιγραφή εκπομπής (όλα τα πεδία με * είναι υποχρεωτικά)." 
          : "Please fill show title, time, and description (all fields with * are required)."
      );
      return;
    }

    setScheduleDraft(prev => {
      return prev.map(dayProg => {
        if (dayProg.day !== selectedDayKey) return dayProg;
        let updatedShows = [...dayProg.shows];
        if (isNew) {
          updatedShows.push({
            ...show,
            id: show.id || `show_${Date.now()}`
          });
        } else {
          updatedShows = updatedShows.map(s => s.id === show.id ? show : s);
        }
        return { ...dayProg, shows: sortShowsByTime(updatedShows) };
      });
    });

    setEditingShow(null);
  };

  const handleDeleteShow = (showId: string) => {
    setScheduleDraft(prev => {
      return prev.map(dayProg => {
        if (dayProg.day !== selectedDayKey) return dayProg;
        return {
          ...dayProg,
          shows: dayProg.shows.filter(s => s.id !== showId)
        };
      });
    });
  };

  const handleSaveAllSchedule = async () => {
    setIsSavingSchedule(true);
    try {
      const sortedDraft = sortScheduleShows(scheduleDraft);
      await saveCustomSchedule(sortedDraft);
      setScheduleDraft(sortedDraft);
      showNotification(isGreek ? "Το εβδομαδιαίο πρόγραμμα αποθηκεύτηκε επιτυχώς!" : "Weekly schedule saved successfully!");
    } catch (err: any) {
      showNotification(undefined, isGreek ? "Σφάλμα κατά την αποθήκευση του προγράμματος." : "Error saving schedule.");
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleResetAllSchedule = async () => {
    setIsResettingSchedule(true);
    try {
      await resetCustomSchedule();
      setScheduleDraft(syncShowsWithDescriptions(JSON.parse(JSON.stringify(WEEKLY_SCHEDULE_GR))));
      showNotification(isGreek ? "Επαναφορά στο αρχικό προεπιλεγμένο πρόγραμμα!" : "Reset to default weekly schedule!");
    } catch (err: any) {
      showNotification(undefined, isGreek ? "Σφάλμα κατά την επαναφορά του προγράμματος." : "Error resetting schedule.");
    } finally {
      setIsResettingSchedule(false);
    }
  };

  // --- ACTIONS: EVENTS ---
  const handleSaveEventDraft = () => {
    if (!editingEvent) return;
    const { isNew, event } = editingEvent;
    if (!event.title.trim() || !event.dayNum.trim() || !event.monthStr.trim()) {
      showNotification(undefined, isGreek ? "Συμπληρώστε τίτλο, ημέρα και μήνα εκδήλωσης." : "Please fill title, day, and month.");
      return;
    }

    setEventsDraft(prev => {
      if (isNew) {
        return [...prev, { ...event, id: event.id || `ev_${Date.now()}` }];
      } else {
        return prev.map(e => e.id === event.id ? event : e);
      }
    });

    setEditingEvent(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEventsDraft(prev => prev.filter(e => e.id !== eventId));
  };

  const handleSaveAllEvents = async () => {
    setIsSavingEvents(true);
    try {
      await saveCustomEvents(eventsDraft);
      showNotification(isGreek ? "Οι εκδηλώσεις αποθηκεύτηκαν επιτυχώς!" : "Events saved successfully!");
    } catch (err: any) {
      showNotification(undefined, isGreek ? "Σφάλμα κατά την αποθήκευση των εκδηλώσεων." : "Error saving events.");
    } finally {
      setIsSavingEvents(false);
    }
  };

  const handleResetAllEvents = async () => {
    setIsResettingEvents(true);
    try {
      await resetCustomEvents();
      setEventsDraft(JSON.parse(JSON.stringify(DEFAULT_EVENTS_GR)));
      showNotification(isGreek ? "Επαναφορά στις αρχικές προεπιλεγμένες εκδηλώσεις!" : "Reset to default events!");
    } catch (err: any) {
      showNotification(undefined, isGreek ? "Σφάλμα κατά την επαναφορά εκδηλώσεων." : "Error resetting events.");
    } finally {
      setIsResettingEvents(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10010] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="bg-white rounded-3xl p-5 sm:p-7 max-w-3xl w-full shadow-2xl border border-black/10 relative overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#78716C] hover:text-[#1C1917] p-1.5 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
          title={isGreek ? "Κλείσιμο" : "Close"}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5 shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-[#ad021a] text-white flex items-center justify-center font-bold shadow-md shadow-[#ad021a]/25 shrink-0">
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
              {isGreek ? "FRS UTH Broadcast System & Content Control" : "FRS UTH Broadcast System & Content Control"}
            </p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex items-center gap-1.5 border-b border-black/[0.08] pb-2 mb-4 shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("status")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "status"
                ? "bg-[#1C1917] text-white shadow-xs"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isGreek ? "Κατάσταση" : "Status"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("applications")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "applications"
                ? "bg-[#1C1917] text-white shadow-xs"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{isGreek ? "Αιτήσεις Open Call" : "Open Call Apps"}</span>
            {applications.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#ad021a] text-white text-[10px] font-black flex items-center justify-center">
                {applications.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("schedule")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "schedule"
                ? "bg-[#1C1917] text-white shadow-xs"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{isGreek ? "Πρόγραμμα Εκπομπών" : "Weekly Schedule"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("events")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "events"
                ? "bg-[#1C1917] text-white shadow-xs"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGreek ? "Εκδηλώσεις / Events" : "Events & Parties"}</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        <AnimatePresence>
          {feedbackSuccess && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-2xl flex items-center gap-2 font-medium shrink-0"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedbackSuccess}</span>
            </motion.div>
          )}

          {feedbackError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-2xl flex items-center gap-2 font-medium shrink-0"
            >
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{feedbackError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TAB CONTENTS CONTAINER (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto pr-1">

          {/* ================= TAB 1: STATUS & SYSTEM ================= */}
          {activeTab === "status" && (
            <div className="space-y-4">
              {/* Coming Soon Screen Toggle */}
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
                            ? (isGreek ? "Ενεργή για όλους τους επισκέπτες" : "Active for all visitors")
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

              {/* Reset Chat & Polls */}
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
                      {isGreek ? "Πλήρης καθαρισμός ιστορικού μηνυμάτων & ενεργής ψηφοφορίας" : "Clear all chat messages & active poll"}
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
          )}

          {/* ================= TAB 2: APPLICATIONS ================= */}
          {activeTab === "applications" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <p className="text-xs text-stone-600 font-medium">
                  {isGreek 
                    ? `Υποβληθείσες αιτήσεις παραγωγών (${applications.length})` 
                    : `Submitted producer applications (${applications.length})`}
                </p>
                <button
                  onClick={loadApplications}
                  disabled={isLoadingApps}
                  className="flex items-center gap-1.5 text-xs text-[#ad021a] font-bold hover:underline cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingApps ? "animate-spin" : ""}`} />
                  <span>{isGreek ? "Ανανέωση" : "Refresh"}</span>
                </button>
              </div>

              {isLoadingApps ? (
                <div className="py-12 flex flex-col items-center justify-center text-stone-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#ad021a]" />
                  <span className="text-xs">{isGreek ? "Φόρτωση αιτήσεων..." : "Loading applications..."}</span>
                </div>
              ) : applications.length === 0 ? (
                <div className="py-12 bg-stone-50 rounded-2xl border border-stone-200/80 text-center p-6 text-stone-500">
                  <Users className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-stone-800">
                    {isGreek ? "Δεν υπάρχουν νέες αιτήσεις" : "No applications yet"}
                  </p>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                    {isGreek 
                      ? "Όταν φοιτητές κάνουν αίτηση μέσω της φόρμας Open Call, τα στοιχεία τους θα εμφανίζονται εδώ."
                      : "When students apply via the Open Call form, their submission details will appear here."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => {
                    const formattedDate = app.createdAt?.seconds 
                      ? new Date(app.createdAt.seconds * 1000).toLocaleDateString(isGreek ? "el-GR" : "en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })
                      : (isGreek ? "Πρόσφατα" : "Recently");

                    return (
                      <div 
                        key={app.id} 
                        className="bg-[#FAF8F4] border border-stone-200/90 rounded-2xl p-4 transition-all hover:border-stone-300 shadow-2xs space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-sm text-[#1C1917]">
                              {app.name}
                            </h4>
                            <span className="text-[11px] text-stone-500 font-mono">
                              📅 {formattedDate}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <a
                              href={`mailto:${app.email}?subject=${encodeURIComponent("FRS UTH — Σχετικά με την αίτηση εκπομπής")}`}
                              className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-stone-700 hover:text-[#ad021a] hover:border-[#ad021a]/30 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title={isGreek ? "Αποστολή Email" : "Send Email"}
                            >
                              <Mail className="w-3.5 h-3.5 text-[#ad021a]" />
                              <span>Email</span>
                            </a>
                            <button
                              onClick={() => handleDeleteApplication(app.id)}
                              disabled={deletingAppId === app.id}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title={isGreek ? "Διαγραφή αίτησης" : "Delete application"}
                            >
                              {deletingAppId === app.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Details row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-600 bg-white/80 p-2.5 rounded-xl border border-stone-200/50">
                          <div className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <a href={`mailto:${app.email}`} className="hover:underline truncate font-mono text-[11px]">
                              {app.email}
                            </a>
                          </div>
                          {app.phone && (
                            <div className="flex items-center gap-1.5 truncate">
                              <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <a href={`tel:${app.phone}`} className="hover:underline font-mono text-[11px]">
                                {app.phone}
                              </a>
                            </div>
                          )}
                          {app.musicGenres && (
                            <div className="sm:col-span-2 flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                                {isGreek ? "Είδη:" : "Genres:"}
                              </span>
                              <span className="text-[11px] font-semibold text-[#ad021a] bg-[#FCECEE] px-2 py-0.5 rounded-md">
                                {app.musicGenres}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Show concept */}
                        {app.showConcept && (
                          <div className="bg-white/80 p-2.5 rounded-xl border border-stone-200/50 text-xs">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                              {isGreek ? "Ιδέα & Περιγραφή Εκπομπής:" : "Show Concept:"}
                            </p>
                            <p className="text-stone-800 leading-relaxed whitespace-pre-wrap text-[11px]">
                              {app.showConcept}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 3: SCHEDULE EDITOR ================= */}
          {activeTab === "schedule" && (
            <div className="space-y-4">
              {/* Day Selector */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                {SCHEDULE_DAYS.map(day => (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => {
                      setSelectedDayKey(day.key);
                      setEditingShow(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedDayKey === day.key
                        ? "bg-[#ad021a] text-white shadow-xs"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    {isGreek ? day.labelGr : day.labelEn}
                  </button>
                ))}
              </div>

              {/* Day Shows Section */}
              <div className="bg-[#FAF8F4] border border-stone-200/90 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-xs text-[#1C1917] flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-[#ad021a]" />
                    <span>
                      {isGreek 
                        ? `Εκπομπές: ${SCHEDULE_DAYS.find(d => d.key === selectedDayKey)?.labelGr} (${currentDayProgram.shows.length})` 
                        : `Shows: ${SCHEDULE_DAYS.find(d => d.key === selectedDayKey)?.labelEn} (${currentDayProgram.shows.length})`}
                    </span>
                  </h4>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingShow({
                        isNew: true,
                        show: {
                          id: `show_${Date.now()}`,
                          time: "18:00 - 20:00",
                          title: "",
                          host: "",
                          tags: ["Radio"],
                          description: ""
                        }
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#1C1917] text-white hover:bg-[#302b28] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isGreek ? "Προσθήκη Εκπομπής" : "Add Show"}</span>
                  </button>
                </div>

                {/* Inline Edit / Add Form */}
                {editingShow && (
                  <div className="bg-white border border-[#ad021a]/30 rounded-xl p-3.5 mb-3 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-1.5">
                      <span className="text-xs font-bold text-[#ad021a]">
                        {editingShow.isNew 
                          ? (isGreek ? "Νέα Εκπομπή" : "New Show") 
                          : (isGreek ? "Επεξεργασία Εκπομπής" : "Edit Show")}
                      </span>
                      <button
                        onClick={() => setEditingShow(null)}
                        className="text-stone-400 hover:text-stone-600 text-xs font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 uppercase mb-0.5">
                          {isGreek ? "Τίτλος Εκπομπής *" : "Show Title *"}
                        </label>
                        <input
                          type="text"
                          value={editingShow.show.title}
                          onChange={(e) => setEditingShow({
                            ...editingShow,
                            show: { ...editingShow.show, title: e.target.value }
                          })}
                          placeholder="π.χ. Night Flight"
                          className="field py-1 px-2.5 text-xs w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 uppercase mb-0.5">
                          {isGreek ? "Παραγωγός / Host *" : "Host *"}
                        </label>
                        <input
                          type="text"
                          value={editingShow.show.host}
                          onChange={(e) => setEditingShow({
                            ...editingShow,
                            show: { ...editingShow.show, host: e.target.value }
                          })}
                          placeholder="π.χ. Alex"
                          className="field py-1 px-2.5 text-xs w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 uppercase mb-0.5">
                          {isGreek ? "Ώρα (π.χ. 18:00 - 20:00) *" : "Time Range *"}
                        </label>
                        <input
                          type="text"
                          value={editingShow.show.time}
                          onChange={(e) => setEditingShow({
                            ...editingShow,
                            show: { ...editingShow.show, time: e.target.value }
                          })}
                          placeholder="18:00 - 20:00"
                          className="field py-1 px-2.5 text-xs w-full font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 uppercase mb-0.5">
                          {isGreek ? "Tags (χωρισμένα με κόμμα)" : "Tags (comma separated)"}
                        </label>
                        <input
                          type="text"
                          value={editingShow.show.tags.join(", ")}
                          onChange={(e) => setEditingShow({
                            ...editingShow,
                            show: { 
                              ...editingShow.show, 
                              tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) 
                            }
                          })}
                          placeholder="Rock, Indie, Talk"
                          className="field py-1 px-2.5 text-xs w-full"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-stone-500 uppercase mb-0.5">
                          {isGreek ? "Περιγραφή Εκπομπής *" : "Show Description *"}
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={editingShow.show.description || ""}
                          onChange={(e) => setEditingShow({
                            ...editingShow,
                            show: { ...editingShow.show, description: e.target.value }
                          })}
                          placeholder={isGreek ? "Αναλυτική περιγραφή εκπομπής (υποχρεωτικό)..." : "Detailed show description (required)..."}
                          className="field py-1 px-2.5 text-xs w-full"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingShow(null)}
                        className="px-3 py-1 rounded-lg text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                      >
                        {isGreek ? "Ακύρωση" : "Cancel"}
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveShowDraft}
                        className="px-4 py-1 rounded-lg text-xs font-bold bg-[#ad021a] text-white hover:bg-[#8f0115] transition-colors cursor-pointer"
                      >
                        {isGreek ? "Ενημέρωση Λίστας" : "Update List"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Shows list */}
                {currentDayProgram.shows.length === 0 ? (
                  <p className="text-xs text-stone-500 italic py-4 text-center">
                    {isGreek ? "Δεν έχουν οριστεί εκπομπές για αυτή την ημέρα." : "No shows scheduled for this day."}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {currentDayProgram.shows.map((s) => (
                      <div 
                        key={s.id}
                        className="bg-white p-3 rounded-xl border border-stone-200/80 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[11px] font-mono font-bold text-[#ad021a] bg-[#FCECEE] px-2 py-0.5 rounded">
                              {s.time}
                            </span>
                            <h5 className="font-bold text-xs text-[#1C1917] truncate">
                              {s.title}
                            </h5>
                          </div>
                          <p className="text-[11px] text-stone-600 truncate">
                            🎙️ {s.host} {s.tags?.length > 0 && `• ${s.tags.join(", ")}`}
                          </p>
                          {s.description && (
                            <p className="text-[10.5px] text-stone-500 line-clamp-1 mt-0.5 italic">
                              {s.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              let showToEdit = { ...s };
                              if (!showToEdit.description?.trim()) {
                                const found = SHOWS_DESCRIPTIONS_GR.find(
                                  d => d.id === s.id || d.title.trim().toLowerCase() === s.title.trim().toLowerCase()
                                );
                                if (found?.description) {
                                  showToEdit.description = found.description;
                                }
                              }
                              setEditingShow({ isNew: false, show: showToEdit });
                            }}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                            title={isGreek ? "Επεξεργασία" : "Edit"}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteShow(s.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title={isGreek ? "Διαγραφή" : "Delete"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Schedule Actions (Save to RTDB / Reset to code default) */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={handleResetAllSchedule}
                  disabled={isResettingSchedule || isSavingSchedule}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-stone-600 hover:text-red-600 hover:bg-stone-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isResettingSchedule ? "animate-spin" : ""}`} />
                  <span>{isGreek ? "Επαναφορά στο Αρχικό" : "Reset to Default"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAllSchedule}
                  disabled={isSavingSchedule || isResettingSchedule}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#ad021a] hover:bg-[#8f0115] text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isSavingSchedule ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isGreek ? "Αποθήκευση Προγράμματος" : "Save Schedule"}</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= TAB 4: EVENTS EDITOR ================= */}
          {activeTab === "events" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-stone-600 font-medium">
                  {isGreek 
                    ? `Προγραμματισμένες εκδηλώσεις σταθμού (${eventsDraft.length})` 
                    : `Station scheduled events (${eventsDraft.length})`}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setEditingEvent({
                      isNew: true,
                      event: {
                        id: `ev_${Date.now()}`,
                        dayNum: "15",
                        monthStr: isGreek ? "ΙΟΥΝ" : "JUN",
                        categoryBadge: "Live Party",
                        timeLocation: "🕒 21:00 • 📍 Βόλος",
                        title: "",
                        description: "",
                        tags: ["#FRS_UTH"]
                      }
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#1C1917] text-white hover:bg-[#302b28] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isGreek ? "Προσθήκη Εκδήλωσης" : "Add Event"}</span>
                </button>
              </div>

              {/* Event Inline Edit / Add Form */}
              {editingEvent && (
                <div className="bg-white border border-[#ad021a]/30 rounded-xl p-3.5 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-1.5">
                    <span className="text-xs font-bold text-[#ad021a]">
                      {editingEvent.isNew 
                        ? (isGreek ? "Νέα Εκδήλωση" : "New Event") 
                        : (isGreek ? "Επεξεργασία Εκδήλωσης" : "Edit Event")}
                    </span>
                    <button
                      onClick={() => setEditingEvent(null)}
                      className="text-stone-400 hover:text-stone-600 text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-0.5">
                        {isGreek ? "Τίτλος Εκδήλωσης *" : "Event Title *"}
                      </label>
                      <input
                        type="text"
                        value={editingEvent.event.title}
                        onChange={(e) => setEditingEvent({
                          ...editingEvent,
                          event: { ...editingEvent.event, title: e.target.value }
                        })}
                        placeholder="Campus Spring Festival 2026"
                        className="field py-1 px-2.5 text-xs w-full"
                      />
                    </div>

                    <div className="flex gap-2">
                      <div className="w-1/2">
                        <label className="block text-[10px] font-bold text-stone-500 uppercase mb-0.5">
                          {isGreek ? "Ημέρα *" : "Day *"}
                        </label>
                        <input
                          type="text"
                          value={editingEvent.event.dayNum}
                          onChange={(e) => setEditingEvent({
                            ...editingEvent,
                            event: { ...editingEvent.event, dayNum: e.target.value }
                          })}
                          placeholder="18"
                          maxLength={2}
                          className="field py-1 px-2.5 text-xs w-full text-center font-bold"
                        />
                      </div>
                      <div className="w-1/2">
                        <label className="block text-[10px] font-bold text-stone-500 uppercase mb-0.5">
                          {isGreek ? "Μήνας *" : "Month *"}
                        </label>
                        <input
                          type="text"
                          value={editingEvent.event.monthStr}
                          onChange={(e) => setEditingEvent({
                            ...editingEvent,
                            event: { ...editingEvent.event, monthStr: e.target.value.toUpperCase() }
                          })}
                          placeholder="ΜΑΙ"
                          maxLength={4}
                          className="field py-1 px-2.5 text-xs w-full text-center font-bold uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-0.5">
                        {isGreek ? "Κατηγορία Badge" : "Category Badge"}
                      </label>
                      <input
                        type="text"
                        value={editingEvent.event.categoryBadge}
                        onChange={(e) => setEditingEvent({
                          ...editingEvent,
                          event: { ...editingEvent.event, categoryBadge: e.target.value }
                        })}
                        placeholder="Festival & Outdoor Stage"
                        className="field py-1 px-2.5 text-xs w-full"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-0.5">
                        {isGreek ? "Ώρα & Τοποθεσία" : "Time & Location"}
                      </label>
                      <input
                        type="text"
                        value={editingEvent.event.timeLocation}
                        onChange={(e) => setEditingEvent({
                          ...editingEvent,
                          event: { ...editingEvent.event, timeLocation: e.target.value }
                        })}
                        placeholder="🕒 19:30 • 📍 Πεδίον του Άρεως, Βόλος"
                        className="field py-1 px-2.5 text-xs w-full"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-0.5">
                        {isGreek ? "Περιγραφή Εκδήλωσης" : "Description"}
                      </label>
                      <textarea
                        rows={2}
                        value={editingEvent.event.description}
                        onChange={(e) => setEditingEvent({
                          ...editingEvent,
                          event: { ...editingEvent.event, description: e.target.value }
                        })}
                        placeholder="Λεπτομέρειες εκδήλωσης..."
                        className="field py-1 px-2.5 text-xs w-full"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-0.5">
                        {isGreek ? "Tags (χωρισμένα με κόμμα)" : "Tags (comma separated)"}
                      </label>
                      <input
                        type="text"
                        value={editingEvent.event.tags.join(", ")}
                        onChange={(e) => setEditingEvent({
                          ...editingEvent,
                          event: {
                            ...editingEvent.event,
                            tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean)
                          }
                        })}
                        placeholder="#LiveBands, #FreeEntry"
                        className="field py-1 px-2.5 text-xs w-full"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingEvent(null)}
                      className="px-3 py-1 rounded-lg text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                    >
                      {isGreek ? "Ακύρωση" : "Cancel"}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEventDraft}
                      className="px-4 py-1 rounded-lg text-xs font-bold bg-[#ad021a] text-white hover:bg-[#8f0115] transition-colors cursor-pointer"
                    >
                      {isGreek ? "Ενημέρωση Λίστας" : "Update List"}
                    </button>
                  </div>
                </div>
              )}

              {/* Events list */}
              {eventsDraft.length === 0 ? (
                <div className="py-8 bg-stone-50 rounded-2xl text-center text-xs text-stone-500">
                  {isGreek ? "Δεν υπάρχουν καταχωρημένα πάρτι / εκδηλώσεις." : "No upcoming parties created yet."}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {eventsDraft.map((ev) => (
                    <div
                      key={ev.id}
                      className="bg-[#FAF8F4] p-3 sm:p-4 rounded-2xl border border-stone-200/90 flex items-start justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-[#FCECEE] text-[#ad021a] border border-[#F2C4C9] flex flex-col items-center justify-center shrink-0">
                          <span className="font-black text-base leading-none">{ev.dayNum}</span>
                          <span className="text-[9px] font-extrabold uppercase mt-0.5 tracking-wider">{ev.monthStr}</span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <span className="text-[10px] font-bold text-[#ad021a] bg-[#FCECEE] px-2 py-0.5 rounded">
                              {ev.categoryBadge}
                            </span>
                            <span className="text-[10px] text-stone-500 font-mono">
                              {ev.timeLocation}
                            </span>
                          </div>
                          <h5 className="font-bold text-xs sm:text-sm text-[#1C1917] truncate">
                            {ev.title}
                          </h5>
                          <p className="text-[11px] text-stone-600 line-clamp-2 mt-0.5 leading-relaxed">
                            {ev.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingEvent({ isNew: false, event: ev })}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                          title={isGreek ? "Επεξεργασία" : "Edit"}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title={isGreek ? "Διαγραφή" : "Delete"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Events Actions (Save to RTDB / Reset to code default) */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={handleResetAllEvents}
                  disabled={isResettingEvents || isSavingEvents}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-stone-600 hover:text-red-600 hover:bg-stone-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isResettingEvents ? "animate-spin" : ""}`} />
                  <span>{isGreek ? "Επαναφορά στα Αρχικά" : "Reset to Default"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAllEvents}
                  disabled={isSavingEvents || isResettingEvents}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#ad021a] hover:bg-[#8f0115] text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isSavingEvents ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isGreek ? "Αποθήκευση Εκδηλώσεων" : "Save Events"}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Logout */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between shrink-0">
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
