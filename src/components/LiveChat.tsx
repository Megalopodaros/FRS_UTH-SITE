/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  X, 
  Edit3, 
  Volume, 
  Volume1, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  Play, 
  Pause, 
  Radio,
  Loader2,
  Sparkles,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ChatMessage, LivePollData } from "../types";
import { collection, addDoc, query, limit, onSnapshot, serverTimestamp, getDocs, deleteDoc, orderBy } from "firebase/firestore";
import { db, rtdb } from "../lib/firebase";
import { ref, onValue, onDisconnect, set } from "firebase/database";
import LivePoll from "./LivePoll";
import { markPollResultAnnounced, isProducerAuthenticated, logoutProducer } from "../lib/pollService";

interface LiveChatProps {
  isGreek: boolean;
  isOpen: boolean;
  onClose: () => void;
  onActiveTrackTrigger?: (trackId: string) => void;
  isInline?: boolean;
  currentLiveShow?: any;
  stationPlaying?: boolean;
  setStationPlaying?: (playing: boolean | ((prev: boolean) => boolean)) => void;
  isLoadingAudio?: boolean;
  setIsLoadingAudio?: (loading: boolean) => void;
  volume?: number;
  setVolume?: (v: number) => void;
  isMuted?: boolean;
  setIsMuted?: (m: boolean) => void;
  activePoll?: LivePollData | null;
}

const TAB_NAME_KEY = "frs_tab_user_name";
const TAB_COLOR_KEY = "frs_tab_avatar_color";
const TAB_SESSION_KEY = "frs_tab_session_id";

const AVATAR_COLORS = [
  "#ad021a",
  "#E06D53",
  "#D97706",
  "#059669",
  "#0284C7",
  "#7C3AED",
  "#DB2777",
  "#4B5563"
];

// Helper to calculate the most recent 3:00 AM cutoff timestamp
const getMostRecent3AM = (): Date => {
  const now = new Date();
  const target = new Date(now);
  target.setHours(3, 0, 0, 0);
  if (now < target) {
    target.setDate(target.getDate() - 1);
  }
  return target;
};

// Prune old messages before cutoff from Firestore in the background
const pruneOldMessages = async (cutoff: Date) => {
  try {
    const cutoffMillis = cutoff.getTime();
    const snap = await getDocs(query(collection(db, "messages"), limit(50)));
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const msgMillis = data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt instanceof Date ? data.createdAt.getTime() : null);
      if (msgMillis && msgMillis < cutoffMillis) {
        deleteDoc(docSnap.ref).catch(() => {});
      }
    });
  } catch (err) {
    console.error("Error pruning old messages:", err);
  }
};

export default function LiveChat({
  isGreek,
  isOpen,
  onClose,
  currentLiveShow,
  stationPlaying = false,
  setStationPlaying,
  isLoadingAudio = false,
  setIsLoadingAudio,
  volume = 0.85,
  setVolume,
  isMuted = false,
  setIsMuted,
  activePoll = null
}: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [userName, setUserName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [onlineCount, setOnlineCount] = useState(1);
  const [isProducer, setIsProducer] = useState<boolean>(() => isProducerAuthenticated());
  const [showProducerAuthModal, setShowProducerAuthModal] = useState(false);
  const [showProducerCreateModal, setShowProducerCreateModal] = useState(false);
  const lastSendTimeRef = useRef<number>(0);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 768 : false));

  // Sync producer authentication state when chat opens
  useEffect(() => {
    setIsProducer(isProducerAuthenticated());
  }, [isOpen]);

  const handleProducerLogout = () => {
    logoutProducer();
    setIsProducer(false);
  };

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Screen size detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input only on desktop when chat opens (avoids auto-opening virtual keyboard on mobile)
  useEffect(() => {
    if (isOpen && !isMobile) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, isMobile]);

  // Initialize unique session identifier and default random name
  useEffect(() => {
    let sessionId = sessionStorage.getItem(TAB_SESSION_KEY);
    if (!sessionId) {
      sessionId = "user_" + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem(TAB_SESSION_KEY, sessionId);
    }

    const savedName = localStorage.getItem(TAB_NAME_KEY);
    if (savedName) {
      setUserName(savedName);
    } else {
      const defaultName = (isGreek ? "Ακροατής #" : "Listener #") + Math.floor(100 + Math.random() * 900);
      setUserName(defaultName);
      localStorage.setItem(TAB_NAME_KEY, defaultName);
    }

    const savedColor = localStorage.getItem(TAB_COLOR_KEY);
    if (savedColor) {
      setAvatarColor(savedColor);
    } else {
      const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
      setAvatarColor(randomColor);
      localStorage.setItem(TAB_COLOR_KEY, randomColor);
    }
  }, [isGreek]);

  // Realtime Database presence for online listeners
  useEffect(() => {
    const sessionId = sessionStorage.getItem(TAB_SESSION_KEY) || "guest_" + Date.now();
    const userStatusRef = ref(rtdb, `/presence/${sessionId}`);
    const connectedRef = ref(rtdb, ".info/connected");
    const allPresenceRef = ref(rtdb, "/presence");

    const unsubConnected = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        set(userStatusRef, {
          online: true,
          lastSeen: Date.now()
        });
        onDisconnect(userStatusRef).remove();
      }
    });

    const unsubPresence = onValue(allPresenceRef, (snap) => {
      if (snap.exists()) {
        const val = snap.val();
        setOnlineCount(Math.max(1, Object.keys(val).length));
      } else {
        setOnlineCount(1);
      }
    });

    return () => {
      unsubConnected();
      unsubPresence();
      set(userStatusRef, null);
    };
  }, []);

  // Listen to Firestore messages
  useEffect(() => {
    const cutoff = getMostRecent3AM();
    pruneOldMessages(cutoff);

    const q = query(
      collection(db, "messages"),
      orderBy("createdAt", "asc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          list.push({
            id: doc.id,
            user: data.user || "Ανώνυμος",
            text: data.text || "",
            timestamp: data.timestamp || "Τώρα",
            avatarColor: data.avatarColor || "#ad021a",
            sessionId: data.sessionId,
            isSystem: Boolean(data.isSystem)
          });
        });
        setMessages(list);
      },
      (err) => {
        console.warn("Firestore live chat subscription notice:", err);
      }
    );

    return () => unsubscribe();
  }, []);

  // Automated Chat Announcement when a Poll concludes
  useEffect(() => {
    if (!activePoll) return;
    const isOver = Date.now() >= activePoll.expiresAt || !activePoll.isActive;
    if (isOver && !activePoll.announcedResult && activePoll.totalVotes > 0) {
      const sorted = [...activePoll.options].sort((a, b) => (b.votes || 0) - (a.votes || 0));
      const winner = sorted[0];
      if (winner && winner.votes > 0) {
        markPollResultAnnounced().then(() => {
          const percent = Math.round((winner.votes / activePoll.totalVotes) * 100);
          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
          addDoc(collection(db, "messages"), {
            user: "FRS UTH System",
            text: isGreek
              ? `📊 Ολοκληρώθηκε το Live Poll: «${activePoll.question}». Νικητής: «${winner.text}» με ${percent}% (${winner.votes} ${winner.votes === 1 ? "ψήφο" : "ψήφους"})!`
              : `📊 Live Poll Ended: "${activePoll.question}". Winner: "${winner.text}" with ${percent}% (${winner.votes} ${winner.votes === 1 ? "vote" : "votes"})!`,
            timestamp: timeStr,
            isSystem: true,
            avatarColor: "#ad021a",
            sessionId: "system",
            createdAt: serverTimestamp()
          }).catch((err) => console.warn("Notice broadcasting poll winner:", err));
        }).catch((err) => console.warn("Notice marking poll result:", err));
      }
    }
  }, [activePoll, isGreek]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const rawText = (customText || inputText).trim();
    if (!rawText) return;

    // Rate limiting: at most 1 message every 500ms
    const nowTimestamp = Date.now();
    if (nowTimestamp - lastSendTimeRef.current < 500) return;
    lastSendTimeRef.current = nowTimestamp;

    // Security & payload truncation
    const textToSend = rawText.slice(0, 500);
    const safeUserName = (userName || "Listener").slice(0, 30);

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const sessionId = sessionStorage.getItem(TAB_SESSION_KEY) || "guest";

    try {
      if (!customText) setInputText("");
      await addDoc(collection(db, "messages"), {
        user: safeUserName,
        text: textToSend,
        timestamp: timeStr,
        avatarColor: avatarColor,
        sessionId: sessionId,
        createdAt: serverTimestamp()
      });

      // Play soft pop sound
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.08);
          gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
          gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.1);
          setTimeout(() => {
            try { audioCtx.close(); } catch {}
          }, 200);
        }
      } catch {}
    } catch (err) {
      console.error("Error sending message to Firestore:", err);
    }
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      const safeName = tempName.trim().slice(0, 30);
      setUserName(safeName);
      localStorage.setItem(TAB_NAME_KEY, safeName);
    }
    setIsEditingName(false);
  };

  const currentSessionId = sessionStorage.getItem(TAB_SESSION_KEY);
  const effectiveVolPercent = isMuted ? 0 : volume * 100;

  const displayShowTitle = currentLiveShow?.title || (isGreek ? "Αυτόματη Ροή FRS UTH" : "FRS UTH Auto Stream");
  const displayShowHost = currentLiveShow ? currentLiveShow.host : "24/7 Campus Radio Rotation";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="chat-modal-wrapper"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`fixed inset-0 z-50 overflow-hidden ${
            isMobile 
              ? "flex justify-end" 
              : "flex items-center justify-center p-4 sm:p-6"
          }`}
        >
          {/* Backdrop */}
          <motion.div
            key="chat-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
          />

          {/* Chat Window Container */}
          <motion.div
            key="chat-window"
            initial={isMobile ? { x: "100%" } : { opacity: 0, scale: 0.96, y: 16 }}
            animate={isMobile ? { x: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isMobile ? { x: "100%" } : { opacity: 0, scale: 0.96, y: 14 }}
            transition={
              isMobile
                ? { type: "spring", damping: 30, stiffness: 300 }
                : { 
                    duration: 0.26, 
                    ease: [0.16, 1, 0.3, 1] 
                  }
            }
            onClick={(e) => e.stopPropagation()}
            className={`relative transform-gpu bg-[#F7F4EC] md:bg-[#F7F4EC]/95 md:backdrop-blur-xl shadow-2xl flex flex-col z-10 will-change-transform ${
              isMobile
                ? "w-full max-w-md h-full border-l border-black/10"
                : "w-full max-w-3xl lg:max-w-4xl h-[720px] max-h-[88vh] rounded-3xl border border-white/80 overflow-hidden my-auto"
            }`}
          >
            {/* Top Bar Header */}
            <div className="bg-white md:bg-white/80 md:backdrop-blur-md px-5 sm:px-6 py-4 border-b border-black/[0.07] flex items-center justify-between shadow-xs shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#FCECEE] text-[#ad021a] flex items-center justify-center font-bold shadow-xs border border-[#F2C4C9]/60 shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-base text-[#1C1917]">
                      {isGreek ? "Live Chat Κοινότητας" : "Community Live Chat"}
                    </h3>
                    <span className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {onlineCount} {isGreek ? "online" : "online"}
                    </span>

                    {/* PRODUCER SHIELD BUTTON NEXT TO ONLINE BADGE */}
                    {!isProducer ? (
                      <button
                        type="button"
                        onClick={() => setShowProducerAuthModal(true)}
                        className="text-[#9C948D] hover:text-[#ad021a] hover:scale-115 active:scale-95 transition-all cursor-pointer p-1 rounded-md"
                        title={isGreek ? "Σύνδεση Παραγωγού" : "Producer Login"}
                        aria-label={isGreek ? "Σύνδεση Παραγωγού" : "Producer Login"}
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-[#FCECEE] border border-[#ad021a]/25 px-2 py-0.5 rounded-full shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setShowProducerCreateModal(true)}
                          className="text-[#ad021a] hover:scale-115 active:scale-95 transition-all cursor-pointer p-0.5"
                          title={isGreek ? "Δημιουργία νέου Poll" : "Create new Poll"}
                          aria-label={isGreek ? "Δημιουργία νέου Poll" : "Create new Poll"}
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                        <span className="text-[#ad021a]/30 text-[10px]">•</span>
                        <button
                          type="button"
                          onClick={handleProducerLogout}
                          className="text-[10px] text-[#78716C] hover:text-[#ad021a] transition-colors cursor-pointer font-medium"
                          title={isGreek ? "Αποσύνδεση Παραγωγού" : "Logout Producer"}
                        >
                          {isGreek ? "Έξοδος" : "Exit"}
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-[#78716C] mt-0.5">
                    {displayShowTitle} • {displayShowHost}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={onClose}
                  className="text-[#78716C] hover:text-[#1C1917] p-2 rounded-full hover:bg-[#F7F4EC] transition-colors cursor-pointer"
                  title={isGreek ? "Κλείσιμο (Esc)" : "Close (Esc)"}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* User Profile Bar (Rename / Color) */}
            <div className="bg-[#FAF8F4] md:bg-white/70 md:backdrop-blur-sm px-5 sm:px-6 py-2.5 border-b border-black/[0.06] flex items-center justify-between text-xs shrink-0">
              {isEditingName ? (
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="Your display name"
                    maxLength={25}
                    className="field py-1 px-2.5 text-xs flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                    }}
                  />
                  <button
                    onClick={handleSaveName}
                    className="bg-[#ad021a] text-white font-bold px-3 py-1 rounded-lg text-xs hover:bg-[#8f0115] transition-colors cursor-pointer"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="text-[#78716C] px-2 py-1 text-xs cursor-pointer hover:text-[#1C1917]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" 
                      style={{ backgroundColor: avatarColor }}
                    />
                    <span className="font-semibold text-xs sm:text-sm text-[#1C1917] truncate max-w-[220px]">
                      {userName}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setTempName(userName);
                      setIsEditingName(true);
                    }}
                    className="text-[#ad021a] hover:text-[#8f0115] font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isGreek ? "Αλλαγή ονόματος" : "Edit Name"}</span>
                  </button>
                </div>
              )}
            </div>

            {/* PINNED LIVE POLL / PRODUCER POLL SECTION */}
            {(activePoll || isProducer) && (
              <div className="px-4 sm:px-6 pt-2.5 pb-2 border-b border-black/[0.06] bg-[#FAF8F4]/80 shrink-0">
                <LivePoll
                  isGreek={isGreek}
                  poll={activePoll || null}
                  sessionId={currentSessionId || ""}
                  isProducer={isProducer}
                  onProducerStatusChange={setIsProducer}
                  showAuthModal={showProducerAuthModal}
                  setShowAuthModal={setShowProducerAuthModal}
                  showCreateModal={showProducerCreateModal}
                  setShowCreateModal={setShowProducerCreateModal}
                />
              </div>
            )}
            {!activePoll && !isProducer && (
              <LivePoll
                isGreek={isGreek}
                poll={null}
                sessionId={currentSessionId || ""}
                isProducer={false}
                onProducerStatusChange={setIsProducer}
                showAuthModal={showProducerAuthModal}
                setShowAuthModal={setShowProducerAuthModal}
                showCreateModal={showProducerCreateModal}
                setShowCreateModal={setShowProducerCreateModal}
              />
            )}

            {/* Main Chat Message Stream (Comfortable Readable Scale) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#78716C]">
                  <MessageSquare className="w-12 h-12 text-[#ad021a]/30 mb-2.5" />
                  <p className="font-bold text-base text-[#1C1917]">
                    {isGreek ? "Καλώς ήρθατε στο FRS UTH Chat!" : "Welcome to FRS UTH Chat!"}
                  </p>
                  <p className="text-xs sm:text-sm mt-1 max-w-sm leading-relaxed text-[#78716C]">
                    {isGreek 
                      ? "Γίνετε οι πρώτοι που θα στείλουν μήνυμα στους υπόλοιπους φοιτητές και ακροατές." 
                      : "Be the first to say hi to your fellow students and listeners across campus."}
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  if (msg.isSystem) {
                    return (
                      <div key={msg.id} className="w-full flex justify-center my-1.5 px-2">
                        <div className="bg-[#FCECEE] border border-[#ad021a]/25 text-[#ad021a] text-xs font-semibold px-4 py-2 rounded-2xl shadow-xs text-center max-w-[95%] leading-relaxed flex items-center justify-center gap-2">
                          <Sparkles className="w-4 h-4 shrink-0 text-[#ad021a]" />
                          <span>{msg.text}</span>
                        </div>
                      </div>
                    );
                  }
                  const isMe = msg.sessionId === currentSessionId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: msg.avatarColor || "#ad021a" }}
                        />
                        <span className="text-[11px] font-bold text-[#1C1917]">
                          {msg.user}
                        </span>
                        <span className="text-[10px] text-[#78716C] font-mono">
                          {msg.timestamp}
                        </span>
                      </div>
                      <div
                        className={`max-w-[80%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-xs break-words leading-relaxed ${
                          isMe
                            ? "bg-[#ad021a] text-white rounded-tr-xs"
                            : "bg-white text-[#1C1917] border border-black/[0.07] rounded-tl-xs"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="bg-white p-3.5 sm:p-4 border-t border-black/10 flex items-center gap-2.5 shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isGreek ? "Γράψτε μήνυμα στην κοινότητα..." : "Type a message to the community..."}
                maxLength={300}
                className="field py-2.5 px-4 text-sm"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-11 h-11 rounded-2xl bg-[#ad021a] hover:bg-[#8f0115] text-white flex items-center justify-center shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-[#ad021a]/20 cursor-pointer"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>

            {/* SLEEK COMPACT BOTTOM MINI-PLAY BAR WITH VOLUME SLIDER */}
            <div className="bg-[#FAF8F4] md:bg-white/80 md:backdrop-blur-md px-4 sm:px-6 py-3 border-t border-black/[0.07] flex items-center justify-between gap-4 shrink-0">
              
              {/* Left: Mini Play Button & Show Info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  onClick={() => {
                    if (setStationPlaying) {
                      if (!stationPlaying) {
                        setIsLoadingAudio?.(true);
                        setStationPlaying(true);
                      } else {
                        setStationPlaying(false);
                        setIsLoadingAudio?.(false);
                      }
                    }
                  }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#1C1917] hover:bg-black text-white flex items-center justify-center shrink-0 shadow-xs transition-transform active:scale-95 cursor-pointer"
                  aria-label={stationPlaying ? "Pause stream" : "Play stream"}
                >
                  {isLoadingAudio ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : stationPlaying ? (
                    <Pause className="w-4 h-4 fill-white text-white" />
                  ) : (
                    <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                  )}
                </button>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ad021a] animate-pulse" />
                    <span className="text-xs sm:text-sm font-bold text-[#1C1917] truncate leading-tight">
                      {displayShowTitle}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#78716C] truncate mt-0.5 font-medium">
                    {displayShowHost}
                  </span>
                </div>
              </div>

              {/* Right: Soundwave Equalizer, Red Volume Slider & Live Tag */}
              <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                
                {/* Soundwave Equalizer */}
                {stationPlaying && (
                  <div className="hidden sm:flex items-end gap-0.5 h-3.5">
                    <span className="w-0.5 bg-[#ad021a] rounded-full animate-wave-1" />
                    <span className="w-0.5 bg-[#ad021a] rounded-full animate-wave-2" />
                    <span className="w-0.5 bg-[#ad021a] rounded-full animate-wave-3" />
                    <span className="w-0.5 bg-[#ad021a] rounded-full animate-wave-4" />
                  </div>
                )}

                {/* Volume Slider in Playbar */}
                {setVolume && setIsMuted && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="text-[#78716C] hover:text-[#ad021a] transition-colors cursor-pointer p-1"
                      aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-3.5 h-3.5 text-[#ad021a]" />
                      ) : volume < 0.4 ? (
                        <Volume className="w-3.5 h-3.5 text-[#ad021a]" />
                      ) : volume < 0.75 ? (
                        <Volume1 className="w-3.5 h-3.5 text-[#ad021a]" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-[#ad021a]" />
                      )}
                    </button>

                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(parseFloat(e.target.value));
                        if (isMuted) setIsMuted(false);
                      }}
                      style={{
                        background: `linear-gradient(to right, #ad021a 0%, #ad021a ${effectiveVolPercent}%, #EFECE3 ${effectiveVolPercent}%, #EFECE3 100%)`
                      }}
                      className="w-16 sm:w-20 h-1.5 hover:h-2 rounded-lg volume-slider transition-all duration-200"
                      aria-label="Volume in chat"
                    />
                  </div>
                )}
                
                <span className="bg-[#ad021a] text-white text-[9px] font-black px-2 py-0.5 rounded tracking-wider uppercase">
                  LIVE
                </span>
              </div>

            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
