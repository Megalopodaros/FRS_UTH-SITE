/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { 
  BarChart2, 
  Clock, 
  Check, 
  Plus, 
  Trash2, 
  Sparkles, 
  Trophy, 
  AlertCircle, 
  X, 
  ShieldCheck, 
  Radio, 
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LivePollData, PollOption } from "../types";
import { 
  castVote, 
  createLivePoll, 
  endActivePoll, 
  clearActivePoll, 
  isProducerAuthenticated, 
  verifyProducerPin,
  logoutProducer,
  PRODUCER_NAME_KEY
} from "../lib/pollService";

interface LivePollProps {
  isGreek: boolean;
  poll: LivePollData | null;
  sessionId: string;
  isProducer?: boolean;
  onProducerStatusChange?: (isProducer: boolean) => void;
  className?: string;
  onOpenChat?: () => void;
  showAuthModal?: boolean;
  setShowAuthModal?: (show: boolean) => void;
  showCreateModal?: boolean;
  setShowCreateModal?: (show: boolean) => void;
}

export default function LivePoll({
  isGreek,
  poll,
  sessionId,
  isProducer: propIsProducer,
  onProducerStatusChange,
  className = "",
  onOpenChat,
  showAuthModal: propShowAuthModal,
  setShowAuthModal: propSetShowAuthModal,
  showCreateModal: propShowCreateModal,
  setShowCreateModal: propSetShowCreateModal
}: LivePollProps) {
  const [internalIsProducer, setInternalIsProducer] = useState<boolean>(() => isProducerAuthenticated());
  const isProducer = propIsProducer !== undefined ? propIsProducer : internalIsProducer;
  const setIsProducer = (val: boolean) => {
    setInternalIsProducer(val);
    onProducerStatusChange?.(val);
  };

  const [internalShowAuthModal, setInternalShowAuthModal] = useState(false);
  const showAuthModal = propShowAuthModal !== undefined ? propShowAuthModal : internalShowAuthModal;
  const setShowAuthModal = propSetShowAuthModal || setInternalShowAuthModal;

  const [internalShowCreateModal, setInternalShowCreateModal] = useState(false);
  const showCreateModal = propShowCreateModal !== undefined ? propShowCreateModal : internalShowCreateModal;
  const setShowCreateModal = propSetShowCreateModal || setInternalShowCreateModal;

  const [pinInput, setPinInput] = useState("");
  const [producerNameInput, setProducerNameInput] = useState("");
  const [authError, setAuthError] = useState("");
  
  // Create Poll Form State
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState<string[]>(["", ""]);
  const [newDuration, setNewDuration] = useState<number>(5);
  const [customDurationInput, setCustomDurationInput] = useState("");
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Voting State
  const [isVoting, setIsVoting] = useState(false);
  const [voteFeedback, setVoteFeedback] = useState<string | null>(null);
  
  // Collapsible toggle
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Time remaining ticker
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync external producer state
  useEffect(() => {
    const current = isProducerAuthenticated();
    setInternalIsProducer(current);
    onProducerStatusChange?.(current);
  }, [onProducerStatusChange]);

  const sanitizedSessionId = useMemo(() => {
    return sessionId ? sessionId.replace(/[.#$[\]/]/g, "_") : "";
  }, [sessionId]);

  const userVotedOptionId = useMemo(() => {
    if (!poll || !poll.voters || !sanitizedSessionId) return null;
    return poll.voters[sanitizedSessionId] || null;
  }, [poll, sanitizedSessionId]);

  const isExpired = useMemo(() => {
    if (!poll) return true;
    return now >= poll.expiresAt || !poll.isActive;
  }, [poll, now]);

  const timeRemainingStr = useMemo(() => {
    if (!poll || isExpired) return isGreek ? "Έληξε" : "Ended";
    const diffSecs = Math.max(0, Math.floor((poll.expiresAt - now) / 1000));
    const mins = Math.floor(diffSecs / 60);
    const secs = diffSecs % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, [poll, isExpired, now, isGreek]);

  // Determine highest vote count for winning option
  const winningOptionId = useMemo(() => {
    if (!poll || !poll.options || poll.options.length === 0) return null;
    if (poll.totalVotes === 0) return null;
    const sorted = [...poll.options].sort((a, b) => (b.votes || 0) - (a.votes || 0));
    return sorted[0]?.votes > 0 ? sorted[0].id : null;
  }, [poll]);

  // Handle Producer PIN Verification
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const defaultProducer = isGreek ? "The Hangover" : "The Hangover";
    const chosenName = producerNameInput.trim() || defaultProducer;
    const ok = verifyProducerPin(pinInput, chosenName);
    if (ok) {
      setIsProducer(true);
      setShowAuthModal(false);
      setPinInput("");
      setProducerNameInput("");
    } else {
      setAuthError(isGreek ? "Λανθασμένο PIN παραγωγού." : "Incorrect producer PIN.");
    }
  };

  const handleLogout = () => {
    logoutProducer();
    setIsProducer(false);
  };

  // Handle Cast Vote
  const handleVote = async (optionId: string) => {
    if (!poll || isExpired || isVoting) return;
    setIsVoting(true);
    setVoteFeedback(null);
    try {
      const res = await castVote(optionId, sessionId);
      if (res.success) {
        setVoteFeedback(isGreek ? "Η ψήφος καταγράφηκε!" : "Vote recorded!");
        setTimeout(() => setVoteFeedback(null), 2500);
      }
    } catch (err) {
      console.warn("Vote err:", err);
    } finally {
      setIsVoting(false);
    }
  };

  // Handle Create Poll
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    const validOptions = newOptions.map((o) => o.trim()).filter((o) => o.length > 0);
    if (!newQuestion.trim()) {
      setCreateError(isGreek ? "Παρακαλώ εισάγετε ερώτηση." : "Please enter a question.");
      return;
    }
    if (validOptions.length < 2) {
      setCreateError(isGreek ? "Απαιτούνται τουλάχιστον 2 επιλογές." : "At least 2 options are required.");
      return;
    }

    const finalDuration = isCustomDuration && parseInt(customDurationInput, 10) > 0
      ? parseInt(customDurationInput, 10)
      : newDuration;

    if (!finalDuration || finalDuration <= 0) {
      setCreateError(isGreek ? "Παρακαλώ εισάγετε έγκυρη διάρκεια σε λεπτά." : "Please enter a valid duration in minutes.");
      return;
    }

    setIsCreating(true);
    try {
      const producerName = sessionStorage.getItem(PRODUCER_NAME_KEY) || (isGreek ? "Παραγωγός" : "Producer");
      await createLivePoll(newQuestion, validOptions, finalDuration, producerName);
      setShowCreateModal(false);
      setNewQuestion("");
      setNewOptions(["", ""]);
      setNewDuration(5);
      setCustomDurationInput("");
      setIsCustomDuration(false);
    } catch (err: any) {
      if (err?.message?.includes("PERMISSION_DENIED") || err?.code === "PERMISSION_DENIED") {
        setCreateError(
          isGreek
            ? "Σφάλμα δικαιωμάτων Firebase (Permission Denied). Πρέπει να ενεργοποιήσετε τους κανόνες (Rules: .read: true, .write: true) στο Firebase Console > Realtime Database."
            : "Firebase Permission Denied. Please enable read/write rules in Firebase Console > Realtime Database > Rules."
        );
      } else {
        setCreateError(err?.message || (isGreek ? "Αποτυχία δημιουργίας ψηφοφορίας." : "Failed to create poll."));
      }
    } finally {
      setIsCreating(false);
    }
  };

  const addOptionField = () => {
    if (newOptions.length < 10) {
      setNewOptions([...newOptions, ""]);
    }
  };

  const removeOptionField = (index: number) => {
    if (newOptions.length > 2) {
      setNewOptions(newOptions.filter((_, i) => i !== index));
    }
  };

  const updateOptionText = (index: number, val: string) => {
    const updated = [...newOptions];
    updated[index] = val;
    setNewOptions(updated);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* -------------------------------------------------------------
          1. ACTIVE POLL CARD (When Poll Exists)
         ------------------------------------------------------------- */}
      {poll ? (
        <div className="bg-white md:bg-white/95 md:backdrop-blur-md rounded-2xl border border-black/10 shadow-md overflow-hidden transition-all">
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-[#ad021a]/10 via-[#ad021a]/5 to-transparent px-4 py-3 border-b border-black/[0.06] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#ad021a] text-white flex items-center justify-center shrink-0 shadow-xs">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#ad021a]">
                    {isGreek ? "ΖΩΝΤΑΝΗ ΨΗΦΟΦΟΡΙΑ" : "LIVE POLL"}
                  </span>
                  {!isExpired && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ad021a] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ad021a]"></span>
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#78716C] truncate font-medium">
                  {poll.createdBy} • {poll.totalVotes} {isGreek ? "ψήφοι" : "votes"}
                </div>
              </div>
            </div>

            {/* Timer Badge & Collapse */}
            <div className="flex items-center gap-2 shrink-0">
              <span 
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                  isExpired 
                    ? "bg-stone-100 text-[#78716C]" 
                    : "bg-[#FCECEE] text-[#ad021a] border border-[#ad021a]/20 animate-pulse"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{timeRemainingStr}</span>
              </span>

              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-[#78716C] hover:text-[#1C1917] p-1 rounded-md transition-colors cursor-pointer"
                title={isCollapsed ? "Expand" : "Collapse"}
              >
                {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Poll Body */}
          {!isCollapsed && (
            <div className="p-4 flex flex-col gap-3">
              {/* Question */}
              <h4 className="font-display font-black text-sm sm:text-base text-[#1C1917] leading-snug">
                {poll.question}
              </h4>

              {/* Options List */}
              <div className="flex flex-col gap-2 pt-1">
                {poll.options.map((option) => {
                  const voteCount = option.votes || 0;
                  const percent = poll.totalVotes > 0 
                    ? Math.round((voteCount / poll.totalVotes) * 100) 
                    : 0;
                  const isUserPick = userVotedOptionId === option.id;
                  const isWinner = isExpired && winningOptionId === option.id;

                  return (
                    <button
                      key={option.id}
                      onClick={() => !isExpired && handleVote(option.id)}
                      disabled={isExpired || isVoting}
                      className={`relative w-full text-left p-2.5 rounded-xl border transition-all overflow-hidden flex items-center justify-between gap-3 cursor-pointer disabled:cursor-default group ${
                        isWinner
                          ? "border-[#ad021a] ring-2 ring-[#ad021a]/20 bg-[#FCECEE]/40"
                          : isUserPick
                          ? "border-[#ad021a] bg-[#FCECEE]/30"
                          : "border-black/[0.08] hover:border-[#ad021a]/40 bg-white"
                      }`}
                    >
                      {/* Animated Percentage Fill Bar */}
                      <div 
                        className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out pointer-events-none ${
                          isWinner 
                            ? "bg-[#ad021a]/15" 
                            : isUserPick 
                            ? "bg-[#ad021a]/12" 
                            : "bg-black/[0.04] group-hover:bg-black/[0.06]"
                        }`}
                        style={{ width: `${percent}%` }}
                      />

                      {/* Option Text & Winner Icon */}
                      <div className="relative z-10 flex items-center gap-2 min-w-0">
                        {isWinner && (
                          <Trophy className="w-4 h-4 text-[#ad021a] shrink-0 animate-bounce" />
                        )}
                        <span className={`text-xs font-semibold truncate ${
                          isWinner || isUserPick ? "text-[#1C1917] font-bold" : "text-[#3A3532]"
                        }`}>
                          {option.text}
                        </span>
                        {isUserPick && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#ad021a] bg-white px-1.5 py-0.5 rounded-md shadow-2xs shrink-0">
                            <Check className="w-3 h-3" />
                            {isGreek ? "Η ψήφος σας" : "Your vote"}
                          </span>
                        )}
                      </div>

                      {/* Percentage & Vote Count */}
                      <div className="relative z-10 flex items-center gap-1.5 shrink-0 text-xs font-mono font-bold text-[#78716C]">
                        <span>{percent}%</span>
                        <span className="text-[10px] opacity-70">({voteCount})</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Feedback toast or switcher instruction */}
              <div className="flex items-center justify-between text-[11px] text-[#78716C] pt-1">
                <div>
                  {!isExpired ? (
                    <span>
                      {userVotedOptionId 
                        ? (isGreek ? "💡 Μπορείτε να αλλάξετε την επιλογή σας μέχρι τη λήξη." : "💡 You can change your choice until timer expires.")
                        : (isGreek ? "Κάντε κλικ σε μια επιλογή για να ψηφίσετε." : "Click an option to cast your vote.")
                      }
                    </span>
                  ) : (
                    <span className="font-bold text-[#ad021a]">
                      {isGreek ? "Η ψηφοφορία ολοκληρώθηκε." : "The poll has concluded."}
                    </span>
                  )}
                </div>

                {voteFeedback && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-[#ad021a] font-bold"
                  >
                    {voteFeedback}
                  </motion.span>
                )}
              </div>

              {/* Producer Management Quick Bar (Visible only when Producer Authenticated) */}
              {isProducer && (
                <div className="mt-2 pt-2 border-t border-black/[0.08] flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ad021a]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {isGreek ? "Λειτουργία Παραγωγού" : "Producer Mode"}
                  </span>
                  <div className="flex items-center gap-2">
                    {!isExpired && (
                      <button
                        onClick={() => endActivePoll()}
                        className="text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md transition-colors cursor-pointer"
                      >
                        {isGreek ? "Λήξη Τώρα" : "End Now"}
                      </button>
                    )}
                    <button
                      onClick={() => clearActivePoll()}
                      className="text-[11px] font-bold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded-md transition-colors cursor-pointer"
                    >
                      {isGreek ? "Διαγραφή" : "Dismiss"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* -------------------------------------------------------------
            2. EMPTY STATE FOR PRODUCER: Create Poll Trigger
           ------------------------------------------------------------- */
        isProducer && (
          <div className="bg-[#FCECEE]/50 border border-[#ad021a]/20 rounded-2xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#ad021a] text-white flex items-center justify-center shrink-0">
                <Radio className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#1C1917] truncate">
                  {isGreek ? "Καμία ενεργή ψηφοφορία" : "No active live poll"}
                </p>
                <p className="text-[11px] text-[#78716C] truncate">
                  {isGreek ? "Ξεκινήστε ένα live poll για τους ακροατές" : "Start a live poll for your audience"}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 bg-[#ad021a] hover:bg-[#8f0115] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-xs transition-all cursor-pointer shrink-0 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isGreek ? "Νέο Poll" : "New Poll"}</span>
            </button>
          </div>
        )
      )}

      {/* -------------------------------------------------------------
          MODAL A: PRODUCER PIN AUTHENTICATION
         ------------------------------------------------------------- */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 md:backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-black/10 relative"
            >
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 text-[#78716C] hover:text-[#1C1917] p-1 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#FCECEE] text-[#ad021a] flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1C1917]">
                    {isGreek ? "Σύνδεση Παραγωγού" : "Producer Login"}
                  </h3>
                  <p className="text-xs text-[#78716C]">
                    {isGreek ? "Εισάγετε το PIN" : "Enter PIN"}
                  </p>
                </div>
              </div>

              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    {isGreek ? "Όνομα Παραγωγού / Εκπομπής:" : "Producer / Show Name:"}
                  </label>
                  <input
                    type="text"
                    value={producerNameInput}
                    onChange={(e) => setProducerNameInput(e.target.value)}
                    placeholder={isGreek ? "π.χ. The Hangover" : "e.g. The Hangover"}
                    className="field py-2 px-3 text-xs w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    {isGreek ? "Κωδικός PIN:" : "PIN Code:"}
                  </label>
                  <input
                    type="password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="••••••"
                    className="field py-2 px-3 text-xs w-full"
                    autoFocus
                    required
                  />
                </div>

                {authError && (
                  <div className="flex items-center gap-1.5 text-xs text-[#ad021a] bg-[#FCECEE] p-2 rounded-xl">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(false)}
                    className="px-4 py-2 text-xs font-bold text-[#78716C] hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
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

      {/* -------------------------------------------------------------
          MODAL B: CREATE NEW POLL
         ------------------------------------------------------------- */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 md:backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-black/10 relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 text-[#78716C] hover:text-[#1C1917] p-1 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#FCECEE] text-[#ad021a] flex items-center justify-center font-bold">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1C1917]">
                    {isGreek ? "Δημιουργία Live Poll" : "Launch Live Poll"}
                  </h3>
                  <p className="text-xs text-[#78716C]">
                    {isGreek ? "Οι ακροατές θα ψηφίσουν σε πραγματικό χρόνο" : "Listeners will vote in real-time"}
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
                {/* Question input */}
                <div>
                  <label className="block text-xs font-bold text-[#1C1917] mb-1">
                    {isGreek ? "Ερώτηση Ψηφοφορίας *" : "Poll Question *"}
                  </label>
                  <input
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder={isGreek ? "π.χ. Ποιο τραγούδι να παίξουμε επόμενο;" : "e.g. Which track should play next?"}
                    className="field py-2.5 px-3 text-xs w-full font-medium"
                    required
                    autoFocus
                    maxLength={140}
                  />
                </div>

                {/* Options List */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#1C1917]">
                      {isGreek ? "Επιλογές Απαντήσεων (2 - 10) *" : "Answer Options (2 - 10) *"}
                    </label>
                    {newOptions.length < 10 && (
                      <button
                        type="button"
                        onClick={addOptionField}
                        className="text-[11px] font-bold text-[#ad021a] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{isGreek ? "Προσθήκη" : "Add"}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {newOptions.map((opt, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#78716C] w-4 text-center">
                          {index + 1}.
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOptionText(index, e.target.value)}
                          placeholder={`${isGreek ? "Επιλογή" : "Option"} ${index + 1}`}
                          className="field py-2 px-3 text-xs flex-1 font-medium"
                          required
                          maxLength={60}
                        />
                        {newOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOptionField(index)}
                            className="text-[#78716C] hover:text-[#ad021a] p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Duration selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#1C1917]">
                      {isGreek ? "Διάρκεια Ψηφοφορίας" : "Poll Duration"}
                    </label>
                    <span className="text-[11px] font-mono font-bold text-[#ad021a]">
                      {isCustomDuration && parseInt(customDurationInput, 10) > 0 
                        ? `${parseInt(customDurationInput, 10)} ${isGreek ? "λεπτά" : "min"}`
                        : `${newDuration} ${isGreek ? "λεπτά" : "min"}`
                      }
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[2, 5, 10, 15].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => {
                          setNewDuration(mins);
                          setIsCustomDuration(false);
                          setCustomDurationInput("");
                        }}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          !isCustomDuration && newDuration === mins
                            ? "bg-[#ad021a] text-white border-[#ad021a] shadow-xs"
                            : "bg-stone-50 hover:bg-stone-100 text-[#1C1917] border-black/10"
                        }`}
                      >
                        {mins} {isGreek ? "λεπτά" : "min"}
                      </button>
                    ))}
                  </div>

                  {/* Custom minutes numeric input */}
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min={1}
                      max={1440}
                      value={customDurationInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomDurationInput(val);
                        const num = parseInt(val, 10);
                        if (!isNaN(num) && num > 0) {
                          setIsCustomDuration(true);
                        } else if (val === "") {
                          setIsCustomDuration(false);
                        }
                      }}
                      onFocus={() => {
                        if (customDurationInput && parseInt(customDurationInput, 10) > 0) {
                          setIsCustomDuration(true);
                        }
                      }}
                      placeholder={isGreek ? "Ή εισάγετε προσαρμοσμένα λεπτά (π.χ. 3, 7, 30, 60)..." : "Or enter custom minutes (e.g. 3, 7, 30, 60)..."}
                      className={`field py-2 px-3 text-xs w-full font-medium transition-all ${
                        isCustomDuration && parseInt(customDurationInput, 10) > 0 ? "border-[#ad021a] ring-2 ring-[#ad021a]/20 bg-white" : ""
                      }`}
                    />
                    {isCustomDuration && parseInt(customDurationInput, 10) > 0 && (
                      <span className="absolute right-3 text-[11px] font-bold text-[#ad021a] pointer-events-none">
                        {parseInt(customDurationInput, 10)} {isGreek ? "λεπτά" : "min"}
                      </span>
                    )}
                  </div>
                </div>

                {createError && (
                  <div className="flex items-center gap-1.5 text-xs text-[#ad021a] bg-[#FCECEE] p-2 rounded-xl">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{createError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.06]">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-bold text-[#78716C] hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
                  >
                    {isGreek ? "Ακύρωση" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-6 py-2.5 text-xs font-bold bg-[#ad021a] hover:bg-[#8f0115] text-white rounded-full shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{isGreek ? "Εκκίνηση..." : "Launching..."}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isGreek ? "Έναρξη Poll" : "Launch Poll"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
