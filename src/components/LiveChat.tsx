/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Send, X, Settings, MessageSquare, ShieldAlert, CheckCircle2, UserCheck, Edit3, Sparkles, Smile, ArrowDown, Users } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ChatMessage } from "../types";
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, where, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface LiveChatProps {
  isGreek: boolean;
  isOpen: boolean;
  onClose: () => void;
  onActiveTrackTrigger: (trackId: string) => void;
  isInline?: boolean;
}

const TAB_NAME_KEY = "frs_tab_user_name";
const TAB_COLOR_KEY = "frs_tab_avatar_color";
const TAB_SESSION_KEY = "frs_tab_session_id";
const STATUS_KEY = "frs_online_status";

const AVATAR_COLORS = [
  "#c1cc94", // Primary Green-yellow
  "#e0e6c3", // Light Olive
  "#fce09b", // Golden Amber
  "#f97758", // Vibrant Coral
  "#a8c5da", // Sky Blue
  "#d4a8da", // Soft Purple
  "#81e6d9", // Teal
  "#fbcfe8"  // Rose
];

const QUICK_EMOJIS = ["🔥", "❤️", "🎧", "⚡", "👏", "🚀"];

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

// Helper to calculate milliseconds until the next 3:00 AM
const getMsUntilNext3AM = (): number => {
  const now = new Date();
  const next = new Date(now);
  next.setHours(3, 0, 0, 0);
  if (now >= next) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
};

// Prune old messages before 3:00 AM from Firestore in the background
const pruneOldMessages = async (cutoff: Date) => {
  try {
    const oldQ = query(
      collection(db, "messages"),
      where("createdAt", "<", cutoff),
      limit(50)
    );
    const snap = await getDocs(oldQ);
    snap.forEach((docSnap) => {
      deleteDoc(docSnap.ref).catch(() => {});
    });
  } catch (err) {
    console.error("Error pruning old messages:", err);
  }
};

export default function LiveChat({ isGreek, isOpen, onClose, onActiveTrackTrigger, isInline = false }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [cutoffDate, setCutoffDate] = useState<Date>(() => getMostRecent3AM());
  
  // Per-Tab session & identity state (so multiple tabs = 2 different listeners!)
  const [userName, setUserName] = useState("Student_101");
  const [userColor, setUserColor] = useState(AVATAR_COLORS[0]);
  const [tabSessionId, setTabSessionId] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  
  // UI Tabs & Inline Editor
  const [activeTab, setActiveTab] = useState<"chat" | "settings">("chat");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempColor, setTempColor] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Auto-scroll tracking
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Initialize Per-Tab Session (`sessionStorage` ensures each tab is completely independent)
  useEffect(() => {
    // Session ID
    let sid = sessionStorage.getItem(TAB_SESSION_KEY);
    if (!sid) {
      sid = "tab_" + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem(TAB_SESSION_KEY, sid);
    }
    setTabSessionId(sid);

    // Username (independent for this exact tab!)
    let storedName = sessionStorage.getItem(TAB_NAME_KEY);
    if (!storedName) {
      const randomNum = Math.floor(Math.random() * 899 + 100);
      storedName = `Listener_${randomNum}`;
      sessionStorage.setItem(TAB_NAME_KEY, storedName);
    }
    setUserName(storedName);
    setTempName(storedName);

    // Avatar Color (independent for this exact tab!)
    let storedColor = sessionStorage.getItem(TAB_COLOR_KEY);
    if (!storedColor) {
      const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
      storedColor = randomColor;
      sessionStorage.setItem(TAB_COLOR_KEY, storedColor);
    }
    setUserColor(storedColor);
    setTempColor(storedColor);

    // Online Status
    const storedStatus = localStorage.getItem(STATUS_KEY);
    if (storedStatus !== null) {
      setIsOnline(storedStatus === "true");
    }
  }, []);

  // 3:00 AM Daily Cutoff Timer & Automatic Background Pruning
  useEffect(() => {
    // Prune any old messages existing before today's 3:00 AM cutoff right away
    pruneOldMessages(cutoffDate);

    const msUntilNext = getMsUntilNext3AM();
    const timer = setTimeout(() => {
      const nextCutoff = getMostRecent3AM();
      setCutoffDate(nextCutoff);
      pruneOldMessages(nextCutoff);
    }, msUntilNext);

    return () => clearTimeout(timer);
  }, [cutoffDate]);

  // Listen to Firestore real-time updates (filtered to today's 3:00 AM cutoff!)
  useEffect(() => {
    const q = query(
      collection(db, "messages"),
      where("createdAt", ">=", cutoffDate),
      orderBy("createdAt", "asc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        // Fallback welcome messages if collection is empty after 3:00 AM cutoff
        const defaults: ChatMessage[] = [
          {
            id: "sys1",
            user: "DJ Nova",
            text: isGreek 
              ? "Καλώς ήρθατε στο FRS! Ετοιμάζω μερικά φρέσκα Techno κομμάτια για απόψε. Ποιος ακούει;" 
              : "Dropping some fresh techno tracks tonight! Who's tuning in?",
            timestamp: "19:42",
            avatarColor: "#c1cc94"
          },
          {
            id: "sys2",
            user: "Sarah V.",
            text: isGreek 
              ? "Ανυπομονώ για το αυριανό Indie Hour! Στείλτε παραγγελίες 🎧" 
              : "Can't wait for Indie Hour tomorrow! Send your requests 🎧",
            timestamp: "19:44",
            avatarColor: "#f97758"
          }
        ];
        setMessages(defaults);
      } else {
        const cutoffMillis = cutoffDate.getTime();
        const fetched: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const msgMillis = data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt instanceof Date ? data.createdAt.getTime() : null);
          if (msgMillis === null || msgMillis >= cutoffMillis) {
            fetched.push({
              id: doc.id,
              user: data.user || "Guest",
              text: data.text || "",
              timestamp: data.timestamp || "",
              isSystem: !!data.isSystem,
              avatarColor: data.avatarColor || "#c1cc94",
              sessionId: data.sessionId || ""
            });
          }
        });

        setMessages(prev => {
          if (containerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 80;
            if (!isNearBottom && fetched.length > prev.length) {
              setNewMsgCount(c => c + (fetched.length - prev.length));
              setIsScrolledUp(true);
            }
          }
          return fetched;
        });
      }
    }, (error) => {
      console.error("Firestore live chat error:", error);
    });

    return () => unsubscribe();
  }, [isGreek, cutoffDate]);

  // Soft Auto-scroll to bottom if user is not scrolled up
  useEffect(() => {
    if (containerRef.current && !isScrolledUp) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      setNewMsgCount(0);
    }
  }, [messages, isOpen, isScrolledUp]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 60;
    if (isNearBottom) {
      setIsScrolledUp(false);
      setNewMsgCount(0);
    } else {
      setIsScrolledUp(true);
    }
  };

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth"
      });
      setIsScrolledUp(false);
      setNewMsgCount(0);
    }
  };

  // Save changes to this tab's independent session (`sessionStorage`)
  const handleSaveIdentity = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = tempName.trim() || `Listener_${Math.floor(Math.random() * 899 + 100)}`;
    
    // Save to sessionStorage (isolated per tab!)
    sessionStorage.setItem(TAB_NAME_KEY, cleanName);
    sessionStorage.setItem(TAB_COLOR_KEY, tempColor);
    
    setUserName(cleanName);
    setUserColor(tempColor);
    setIsEditingName(false);
    
    // Also update general settings status if in settings
    localStorage.setItem(STATUS_KEY, String(isOnline));
    
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 1200);
  };

  // Broadcast messages to Firestore database
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMsg = inputText.trim();
    if (!cleanMsg) return;

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setInputText("");

    try {
      await addDoc(collection(db, "messages"), {
        user: userName,
        text: cleanMsg,
        timestamp: time,
        avatarColor: userColor,
        sessionId: tabSessionId,
        createdAt: serverTimestamp()
      });
      scrollToBottom();
      pruneOldMessages(cutoffDate);
    } catch (error) {
      console.error("Error sending message to Firestore:", error);
    }
  };

  const handleQuickEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji);
  };

  const chatContent = (
    <div
      id={isInline ? "inline-live-chat" : "chat-sliding-sidebar"}
      className={
        isInline
          ? "w-full max-w-4xl glass-panel rounded-3xl flex flex-col shadow-2xl overflow-hidden h-[540px] relative transition-all"
          : "fixed top-0 right-0 h-[calc(100%-144px)] md:h-[calc(100%-84px)] w-full sm:w-[420px] glass-panel border-l border-white/15 z-[55] rounded-none flex flex-col shadow-2xl overflow-hidden transition-all"
      }
    >
      {/* Header section */}
      <div className="p-4 border-b border-white/10 bg-white/[0.04] backdrop-blur-md flex flex-col gap-3 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-primary animate-pulse" : "bg-outline"}`} />
            <div>
              <h2 className="font-headline text-sm font-bold text-primary flex items-center gap-2">
                <span>{isGreek ? "Ζωντανή Συνομιλία" : "Live Chat"}</span>
              </h2>
            </div>
          </div>
          {!isInline && (
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-primary transition-colors p-1.5 rounded-full hover:bg-surface-container cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Selector inside Side Panel */}
        <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant/20">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-1.5 px-3 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "chat"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>{isGreek ? "Μηνύματα" : "Messages"}</span>
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-1 py-1.5 px-3 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "settings"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <Settings className="w-3 h-3" />
            <span>{isGreek ? "Ρυθμίσεις / Όνομα" : "Settings / Identity"}</span>
          </button>
        </div>
      </div>

      {/* Switchable views */}
      <div className="flex-grow relative overflow-hidden bg-transparent">
        {activeTab === "chat" ? (
          /* MESSAGES CHANNEL VIEW */
          <div className="absolute inset-0 flex flex-col">
            
            {/* Top Interactive User Presence & Instant Edit Pill */}
            <div className="px-3.5 py-2 bg-white/[0.03] backdrop-blur-md border-b border-white/10 flex items-center justify-between flex-shrink-0 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-on-surface-variant shadow-xs flex-shrink-0"
                  style={{ backgroundColor: userColor, color: "#181b11" }}
                >
                  {userName.slice(0, 2).toUpperCase()}
                </span>
                <span className="text-on-surface-variant/80 truncate">
                  {isGreek ? "Συνδεδεμένος ως:" : "Joined as:"}{" "}
                  <strong className="text-primary font-bold">{userName}</strong>
                </span>
              </div>
              <button
                onClick={() => {
                  setTempName(userName);
                  setTempColor(userColor);
                  setIsEditingName(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 font-bold text-[11px] transition-all cursor-pointer flex-shrink-0"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isGreek ? "Αλλαγή" : "Edit Name"}</span>
              </button>
            </div>

            {/* Inline Quick Username Editor Modal / Popover */}
            <AnimatePresence>
              {isEditingName && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-10 left-0 right-0 z-30 p-4 bg-surface-container-high border-b border-primary/30 shadow-xl flex flex-col gap-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isGreek ? "Επεξεργασία Ονόματος & Χρώματος" : "Edit Username & Avatar Color"}</span>
                    </span>
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="text-on-surface-variant hover:text-primary p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveIdentity} className="flex flex-col gap-3">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      placeholder={isGreek ? "Πληκτρολογήστε όνομα..." : "Enter username..."}
                      maxLength={20}
                      autoFocus
                      className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl py-2 px-3 text-xs text-on-surface focus:outline-none focus:border-primary font-bold"
                    />

                    {/* Color swatches */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-on-surface-variant">{isGreek ? "Χρώμα:" : "Color:"}</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {AVATAR_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setTempColor(color)}
                            className={`w-6 h-6 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                              tempColor === color ? "scale-125 ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:scale-110 opacity-80"
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end mt-1">
                      <button
                        type="button"
                        onClick={() => setIsEditingName(false)}
                        className="px-3 py-1.5 rounded-lg bg-surface-container text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                      >
                        {isGreek ? "Ακύρωση" : "Cancel"}
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:brightness-105 transition-all shadow-sm cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isGreek ? "Αποθήκευση" : "Save Identity"}</span>
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message List */}
            <div
              ref={containerRef}
              onScroll={handleScroll}
              className="flex-grow overflow-y-auto p-4 flex flex-col gap-3 no-scrollbar scroll-smooth"
            >
              {messages.map((msg) => {
                // If sessionId matches this tab's sessionId, OR username matches (and not system), treat as own message
                const isMe = !msg.isSystem && (msg.sessionId ? msg.sessionId === tabSessionId : msg.user === userName);
                const color = msg.avatarColor || "#c1cc94";

                if (msg.isSystem) {
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, scale: 0.95, y: 12 }}
                      whileInView={{ opacity: 1, scale: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.1 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="self-center my-2 max-w-[90%] bg-primary/15 backdrop-blur-md border border-primary/40 rounded-2xl p-3 text-center flex flex-col gap-1 shadow-md"
                    >
                      <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span>ON AIR • ANNOUNCEMENT</span>
                      </div>
                      <p className="text-xs font-semibold text-on-surface leading-relaxed">
                        {msg.text}
                      </p>
                      <span className="text-[9px] text-on-surface-variant/60">{msg.timestamp}</span>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 14, scale: 0.96 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className={`flex gap-2.5 max-w-[85%] ${isMe ? "self-end flex-row-reverse" : "self-start flex-row"}`}
                  >
                    {/* Avatar Badge */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold shadow-md flex-shrink-0 mt-1"
                      style={{ backgroundColor: color, color: "#181b11" }}
                      title={msg.user}
                    >
                      {msg.user.slice(0, 2).toUpperCase()}
                    </div>

                    <div className={`flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                      <div className="flex items-center gap-1.5 px-1">
                        <span className={`text-[11px] font-bold tracking-wide ${isMe ? "text-primary" : "text-on-surface"}`}>
                          {msg.user}
                        </span>
                        <span className="text-[9px] text-on-surface-variant/60 font-mono">
                          {msg.timestamp}
                        </span>
                      </div>
                      <div
                        className={`p-3 px-3.5 rounded-2xl text-xs break-words shadow-md leading-relaxed backdrop-blur-md ${
                          isMe
                            ? "bg-primary/25 text-on-surface rounded-tr-none border border-primary/40 shadow-primary/10"
                            : "bg-white/[0.07] text-on-surface rounded-tl-none border border-white/12"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Floating New Message / Scroll to Bottom Pill */}
            <AnimatePresence>
              {isScrolledUp && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  onClick={scrollToBottom}
                  className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-primary text-on-primary font-bold text-xs shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span>
                    {newMsgCount > 0
                      ? (isGreek ? `${newMsgCount} Νέα Μηνύματα` : `${newMsgCount} New Messages`)
                      : (isGreek ? "Πιο Πρόσφατα" : "Latest Messages")}
                  </span>
                </motion.button>
              )}
            </AnimatePresence>

            {/* Quick Emoji Reactions Bar */}
            <div className="px-3 py-1.5 bg-surface-container-highest/60 border-t border-outline-variant/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-on-surface-variant font-semibold flex items-center gap-1 pr-1 border-r border-outline-variant/30 flex-shrink-0">
                <Smile className="w-3 h-3 text-primary" />
                <span className="hidden sm:inline">{isGreek ? "Αντιδράσεις:" : "React:"}</span>
              </span>
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleQuickEmoji(emoji)}
                  className="w-7 h-7 rounded-lg hover:bg-primary/20 flex items-center justify-center text-sm transition-transform active:scale-125 cursor-pointer flex-shrink-0"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Typing Input Composer */}
            <div className="p-3 border-t border-white/10 bg-white/[0.03] backdrop-blur-md flex-shrink-0">
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <input
                  type="text"
                  autoComplete="off"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isGreek
                      ? `Μήνυμα ως ${userName}...`
                      : `Message as ${userName}...`
                  }
                  className="w-full glass-pill rounded-full py-2.5 pl-4 pr-11 text-xs text-on-surface focus:outline-none focus:border-primary transition-all placeholder:text-on-surface-variant/50 shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="absolute right-1.5 w-8 h-8 rounded-full bg-primary text-on-primary hover:scale-105 active:scale-95 transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-sm"
                >
                  <Send className="w-3.5 h-3.5 fill-on-primary" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* PROFILE & SESSION SETTINGS VIEW */
          <div className="absolute inset-0 p-6 flex flex-col gap-6 overflow-y-auto">
            <div className="flex items-center gap-3 pb-3 border-b border-outline-variant/20">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-extrabold shadow-lg"
                style={{ backgroundColor: userColor, color: "#181b11" }}
              >
                {userName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-headline text-base font-bold text-primary">
                  {userName}
                </h3>
                <p className="text-xs text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span>{isGreek ? "Ανεξάρτητη Συνεδρία Tab" : "Independent Tab Session"}</span>
                </p>
              </div>
            </div>

            <form onSubmit={(e) => {
              handleSaveIdentity(e);
              setTempName(userName);
            }} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="settings-name-input" className="text-xs font-bold text-primary tracking-wider uppercase flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  <span>{isGreek ? "Όνομα Χρήστη σε Αυτή την Καρτέλα (Tab)" : "Username in this Tab"}</span>
                </label>
                <input
                  type="text"
                  id="settings-name-input"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  maxLength={20}
                  className="w-full bg-surface-container border border-outline-variant/50 rounded-xl py-3 px-4 text-sm text-on-surface font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  {isGreek 
                    ? "Μπορείτε να ανοίξετε πολλαπλές καρτέλες στο πρόγραμμα περιήγησης και κάθε καρτέλα να έχει δικό της ανεξάρτητο όνομα και χρώμα!"
                    : "You can open multiple browser tabs and give each tab its own independent username and avatar color!"}
                </p>
              </div>

              {/* Avatar Color Choice */}
              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-bold text-primary tracking-wider uppercase">
                  {isGreek ? "Χρώμα Εικονιδίου" : "Avatar Badge Color"}
                </label>
                <div className="flex gap-2.5 flex-wrap p-3 bg-surface-container/50 border border-outline-variant/30 rounded-2xl">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setTempColor(color)}
                      className={`w-9 h-9 rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-sm ${
                        tempColor === color ? "scale-115 ring-2 ring-primary ring-offset-2 ring-offset-background font-bold text-black" : "hover:scale-105 opacity-85"
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {tempColor === color && <span className="text-xs text-black">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-primary tracking-wider uppercase">
                  {isGreek ? "Κατάσταση" : "Online Presence"}
                </label>
                <div className="flex items-center justify-between p-4 bg-surface-container/50 border border-outline-variant/30 rounded-2xl">
                  <span className="text-sm font-medium">
                    {isGreek ? "Εμφάνιση ως Online στο Campus" : "Appear Online to Campus"}
                  </span>
                  <button
                    onClick={() => setIsOnline(!isOnline)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      isOnline ? "bg-primary" : "bg-outline-variant"
                    }`}
                    type="button"
                  >
                    <motion.div
                      layout
                      className="bg-surface-container-lowest w-4 h-4 rounded-full shadow-md"
                      animate={{ x: isOnline ? 20 : 0 }}
                    />
                  </button>
                </div>
              </div>

              {/* Save Feedback Button */}
              <button
                type="submit"
                className="w-full bg-primary text-on-primary font-bold py-3.5 px-4 rounded-2xl hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/15 cursor-pointer mt-2"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{isGreek ? "Οι αλλαγές αποθηκεύτηκαν!" : "Saved Successfully!"}</span>
                  </>
                ) : (
                  <span>{isGreek ? "Αποθήκευση Ταυτότητας" : "Save Tab Identity"}</span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );

  if (isInline) {
    return chatContent;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay for mobile layouts */}
          <div
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[49] md:hidden"
            onClick={onClose}
          />

          <motion.div
            initial={{ translateX: "100%" }}
            animate={{ translateX: 0 }}
            exit={{ translateX: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] z-50 flex flex-col shadow-2xl overflow-hidden"
          >
            {chatContent}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
