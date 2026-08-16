/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Send, X, Edit3, Sparkles, Smile, ArrowDown, Users, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ChatMessage } from "../types";
import { collection, addDoc, query, limit, onSnapshot, serverTimestamp, getDocs, deleteDoc } from "firebase/firestore";
import { db, rtdb } from "../lib/firebase";
import { ref, onValue, onDisconnect, set } from "firebase/database";

interface LiveChatProps {
  isGreek: boolean;
  isOpen: boolean;
  onClose: () => void;
  onActiveTrackTrigger?: (trackId: string) => void;
  isInline?: boolean;
  currentLiveShow?: any;
}

const TAB_NAME_KEY = "frs_tab_user_name";
const TAB_COLOR_KEY = "frs_tab_avatar_color";
const TAB_SESSION_KEY = "frs_tab_session_id";

const AVATAR_COLORS = [
  "#ff5a36",
  "#e0e6c3",
  "#fce09b",
  "#f97758",
  "#a8c5da",
  "#d4a8da",
  "#81e6d9",
  "#fbcfe8"
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

export default function LiveChat({ isGreek, isOpen, onClose, isInline = false, currentLiveShow }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [cutoffDate, setCutoffDate] = useState<Date>(() => getMostRecent3AM());
  const [viewportHeight, setViewportHeight] = useState("100dvh");
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    
    const handleResize = () => {
      setViewportHeight(`${window.visualViewport.height}px`);
    };

    handleResize();

    window.visualViewport.addEventListener("resize", handleResize);
    window.visualViewport.addEventListener("scroll", handleResize);
    return () => {
      window.visualViewport.removeEventListener("resize", handleResize);
      window.visualViewport.removeEventListener("scroll", handleResize);
    };
  }, []);

  // Helper to calculate exact start time for the current live show today
  const getShowStartTime = (show: any): Date | null => {
    if (!show || !show.time) return null;
    const parts = show.time.split("-").map((s: string) => s.trim());
    if (parts.length > 0) {
      const [startH, startM] = parts[0].split(":").map(Number);
      if (!isNaN(startH)) {
        const now = new Date();
        const startTime = new Date(now);
        startTime.setHours(startH, isNaN(startM) ? 0 : startM, 0, 0);
        if (startTime > now) {
          startTime.setDate(startTime.getDate() - 1);
        }
        return startTime;
      }
    }
    return null;
  };

  const currentShowId = currentLiveShow?.id || "auto_stream";
  const prevShowIdRef = useRef<string | null>(null);

  useEffect(() => {
    const showStart = getShowStartTime(currentLiveShow);
    const effectiveCutoff = showStart || getMostRecent3AM();
    setCutoffDate(effectiveCutoff);

    if (prevShowIdRef.current !== currentShowId) {
      prevShowIdRef.current = currentShowId;
      setMessages([]); // Instant UI reset when show changes
      pruneOldMessages(effectiveCutoff);
    }
  }, [currentShowId, currentLiveShow]);

  // Per-Tab session & identity state
  const [userName, setUserName] = useState("Listener_687");
  const [userColor, setUserColor] = useState(AVATAR_COLORS[0]);
  const [tabSessionId, setTabSessionId] = useState("");
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempColor, setTempColor] = useState("");
  const [inputText, setInputText] = useState("");
  
  // Auto-scroll tracking
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Use Firebase Realtime Database (RTDB) for Native Presence
  const [siteUsersCount, setSiteUsersCount] = useState<number>(1);

  useEffect(() => {
    if (!tabSessionId || !rtdb) return;

    let unsubConnected = () => {};
    let unsubPresence = () => {};

    try {
      const myPresenceRef = ref(rtdb, `presence/${tabSessionId}`);
      const connectedRef = ref(rtdb, ".info/connected");
      
      unsubConnected = onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
          onDisconnect(myPresenceRef).remove().then(() => {
            set(myPresenceRef, true).catch(() => {});
          }).catch(() => {});
        }
      }, (err) => console.warn("RTDB connected error:", err));

      const allPresenceRef = ref(rtdb, "presence");
      unsubPresence = onValue(allPresenceRef, (snap) => {
        if (snap.exists()) {
          const count = Object.keys(snap.val()).length;
          setSiteUsersCount(Math.max(1, count));
        } else {
          setSiteUsersCount(1);
        }
      }, (err) => console.warn("RTDB presence error:", err));
    } catch (e) {
      console.warn("RTDB initialization error:", e);
    }

    return () => {
      try {
        unsubConnected();
        unsubPresence();
        if (rtdb && tabSessionId) {
          const myPresenceRef = ref(rtdb, `presence/${tabSessionId}`);
          set(myPresenceRef, null).catch(() => {});
        }
      } catch (e) {}
    };
  }, [tabSessionId]);

  // Initialize Per-Tab Session
  useEffect(() => {
    let sid = sessionStorage.getItem(TAB_SESSION_KEY);
    if (!sid) {
      sid = "tab_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();
      sessionStorage.setItem(TAB_SESSION_KEY, sid);
    }
    setTabSessionId(sid);

    let storedName = sessionStorage.getItem(TAB_NAME_KEY);
    if (!storedName) {
      const randomNum = Math.floor(Math.random() * 899 + 100);
      storedName = `Listener_${randomNum}`;
      sessionStorage.setItem(TAB_NAME_KEY, storedName);
    }
    setUserName(storedName);
    setTempName(storedName);

    let storedColor = sessionStorage.getItem(TAB_COLOR_KEY);
    if (!storedColor) {
      storedColor = AVATAR_COLORS[0];
      sessionStorage.setItem(TAB_COLOR_KEY, storedColor);
    }
    setUserColor(storedColor);
    setTempColor(storedColor);
  }, []);

  // 3:00 AM Daily Cutoff Timer
  useEffect(() => {
    pruneOldMessages(cutoffDate);

    const msUntilNext = getMsUntilNext3AM();
    const timer = setTimeout(() => {
      const nextCutoff = getMostRecent3AM();
      setCutoffDate(nextCutoff);
      pruneOldMessages(nextCutoff);
    }, msUntilNext);

    return () => clearTimeout(timer);
  }, [cutoffDate]);

  // Listen to Firestore real-time updates
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const q = query(
        collection(db, "messages"),
        limit(100)
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
          setMessages([]);
        } else {
          const cutoffMillis = cutoffDate.getTime();
          const fetched: (ChatMessage & { rawTime: number })[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const msgMillis = data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt instanceof Date ? data.createdAt.getTime() : Date.now());
            if (msgMillis >= cutoffMillis) {
              fetched.push({
                id: docSnap.id,
                user: data.user || "Guest",
                text: data.text || "",
                timestamp: data.timestamp || "",
                isSystem: !!data.isSystem,
                avatarColor: data.avatarColor || "#ff5a36",
                sessionId: data.sessionId || "",
                rawTime: msgMillis
              });
            }
          });

          fetched.sort((a, b) => a.rawTime - b.rawTime);
          setMessages(fetched);
        }
      }, (error) => {
        console.error("Firestore live chat error:", error);
      });
    } catch (err) {
      console.error("Error setting up Firestore listener:", err);
    }

    return () => unsubscribe();
  }, [isGreek, cutoffDate, currentLiveShow]);

  // Auto-scroll to bottom
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

  const handleSaveIdentity = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = tempName.trim() || `Listener_${Math.floor(Math.random() * 899 + 100)}`;
    
    sessionStorage.setItem(TAB_NAME_KEY, cleanName);
    sessionStorage.setItem(TAB_COLOR_KEY, tempColor);
    
    setUserName(cleanName);
    setUserColor(tempColor);
    setIsEditingName(false);
  };

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
    <div className={`w-full flex flex-col shadow-2xl overflow-hidden relative border border-white/10 bg-surface-container-low ${isInline ? "max-w-[896px] h-[520px] md:h-[620px] rounded-3xl" : "h-full rounded-none"} ${isInline || !isMobile ? "glass-panel" : ""}`}>
      {/* 1. Header Section (Compact) */}
      <div className="px-4 sm:px-6 py-3 border-b border-white/10 bg-white/[0.03] flex justify-between items-center gap-2 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          <h2 className="font-headline text-base font-bold text-primary">
            {isGreek ? "Ζωντανή Συνομιλία" : "Live Chat"}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary text-xs font-bold font-mono">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span>{siteUsersCount} Online</span>
          </span>

          {!isInline && (
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-primary transition-colors p-1.5 rounded-full hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Sub-header User Identity Bar (Compact) */}
      <div className="px-4 sm:px-6 py-2 border-b border-white/10 bg-white/[0.02] flex items-center justify-between gap-2 flex-shrink-0 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs flex-shrink-0"
            style={{ backgroundColor: userColor, color: "#181b11" }}
          >
            {userName.slice(0, 1).toUpperCase()}
          </div>
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
          className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 font-bold text-xs transition-colors cursor-pointer flex-shrink-0"
        >
          <Edit3 className="w-3 h-3" />
          <span>{isGreek ? "Αλλαγή" : "Edit Name"}</span>
        </button>
      </div>

       {/* Inline Quick Username Editor Modal */}
       <AnimatePresence>
         {isEditingName && (
           <motion.div
             {...(isMobile ? {} : {
               initial: { opacity: 0, y: -10 },
               animate: { opacity: 1, y: 0 },
               exit: { opacity: 0, y: -10 }
             })}
             className="absolute top-16 left-4 right-4 sm:left-6 sm:right-6 z-30 p-4 bg-surface-container border border-primary/40 rounded-2xl shadow-2xl flex flex-col gap-3"
           >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
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
                className="w-full bg-white/[0.06] border border-white/15 rounded-xl py-2 px-3 text-xs text-on-surface focus:outline-none focus:border-primary font-bold"
              />

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-on-surface-variant">{isGreek ? "Χρώμα:" : "Color:"}</span>
                <div className="flex gap-2 flex-wrap">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setTempColor(color)}
                      className={`w-5 h-5 rounded-full transition-all cursor-pointer flex items-center justify-center ${
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
                  className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                >
                  {isGreek ? "Ακύρωση" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:brightness-105 transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isGreek ? "Αποθήκευση" : "Save Identity"}</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Messages List Area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-grow overflow-y-auto p-4 sm:p-5 flex flex-col gap-3 no-scrollbar scroll-smooth relative"
      >
        {/* Centered Top Live Broadcast Announcement Pill */}
        <div className="my-1.5 mx-auto inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/15 text-on-surface text-xs font-bold shadow-md">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>
            {currentLiveShow ? (
              isGreek ? `Ζωντανά τώρα: "${currentLiveShow.title}"` : `Live Now: "${currentLiveShow.title}"`
            ) : (
              isGreek ? 'Ζωντανά τώρα: "Αυτόματη Ροή"' : 'Live Now: "Automated Stream"'
            )}
          </span>
        </div>

        {messages.map((msg) => {
          const isMe = !msg.isSystem && (msg.sessionId ? msg.sessionId === tabSessionId : msg.user === userName);
          const color = msg.avatarColor || "#ff5a36";

           if (msg.isSystem) {
             const sysMotion = isMobile ? {} : {
               initial: { opacity: 0, scale: 0.95, y: 12 },
               whileInView: { opacity: 1, scale: 1, y: 0 },
               viewport: { once: true, amount: 0.1 },
               transition: { duration: 0.35, ease: "easeOut" }
             };
             return (
               <motion.div
                 key={msg.id}
                 {...sysMotion}
                 className="self-center my-1.5 max-w-[90%] bg-primary/15 backdrop-blur-md border border-primary/40 rounded-2xl py-2 px-3.5 text-center shadow-md flex items-center justify-center gap-2"
               >
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                <span className="text-xs font-bold text-on-surface">
                  {msg.text}
                </span>
              </motion.div>
            );
          }

           const userMotion = isMobile ? {} : {
             initial: { opacity: 0, y: 14, scale: 0.96 },
             whileInView: { opacity: 1, y: 0, scale: 1 },
             viewport: { once: true, amount: 0.1 },
             transition: { duration: 0.35, ease: "easeOut" }
           };
           return (
             <motion.div
               key={msg.id}
               {...userMotion}
               className={`flex gap-2.5 max-w-[85%] ${isMe ? "self-end flex-row-reverse" : "self-start flex-row"}`}
             >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold shadow-md flex-shrink-0 mt-0.5"
                style={{ backgroundColor: color, color: "#181b11" }}
                title={msg.user}
              >
                {msg.user.slice(0, 1).toUpperCase()}
              </div>

              <div className={`flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-1.5 px-1">
                  <span className={`text-xs font-bold tracking-wide ${isMe ? "text-primary" : "text-on-surface"}`}>
                    {msg.user}
                  </span>
                  <span className="text-[10px] text-on-surface-variant/60 font-mono">
                    {msg.timestamp}
                  </span>
                </div>
                <div
                  className={`p-3 rounded-2xl text-xs break-words shadow-md leading-relaxed backdrop-blur-md ${
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

      {/* Floating New Message Pill */}
       <AnimatePresence>
         {isScrolledUp && (
           <motion.button
             {...(isMobile ? {} : {
               initial: { opacity: 0, y: 10 },
               animate: { opacity: 1, y: 0 },
               exit: { opacity: 0, y: 10 }
             })}
             onClick={scrollToBottom}
             className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-primary text-white font-bold text-xs shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
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

      {/* 4. Reactions Bar (Compact) */}
      <div className="px-4 sm:px-5 py-1.5 bg-surface-container border-t border-white/10 flex items-center gap-2.5 overflow-x-auto no-scrollbar flex-shrink-0">
        <span className="text-[11px] text-on-surface-variant/80 font-semibold flex items-center gap-1.5 flex-shrink-0">
          <Smile className="w-3.5 h-3.5 text-primary" />
          <span>{isGreek ? "Αντιδράσεις:" : "React:"}</span>
        </span>
        <div className="flex items-center gap-1.5">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleQuickEmoji(emoji)}
              className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center text-base transition-transform active:scale-125 cursor-pointer flex-shrink-0"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Typing Input Composer Footer */}
      <div className="p-3.5 md:p-4 border-t border-white/10 bg-surface-container-low flex-shrink-0">
        <form onSubmit={handleSendMessage} className="relative flex items-center">
          <input
            type="text"
            autoComplete="off"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onFocus={(e) => {
              const target = e.target;
              setTimeout(() => {
                target.scrollIntoView({ behavior: "smooth", block: "center" });
              }, 300);
            }}
            placeholder={
              isGreek
                ? `Μήνυμα ως ${userName}...`
                : `Message as ${userName}...`
            }
            className="w-full bg-white/[0.06] border border-white/12 rounded-full py-3 pl-5 pr-14 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-all placeholder:text-on-surface-variant/50 shadow-inner"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-primary text-white hover:scale-105 active:scale-95 transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-md"
          >
            <Send className="w-4 h-4 fill-white" />
          </button>
        </form>
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
          {/* Backdrop Overlay */}
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             transition={{ duration: 0.2 }}
             className="fixed inset-0 bg-black/30 z-[55]"
             onClick={onClose}
           />

          {/* Sliding Right Sidebar Drawer */}
           <motion.div
             initial={{ translateX: "100%" }}
             animate={{ translateX: 0 }}
             exit={{ translateX: "100%" }}
             transition={{ type: "tween", duration: isMobile ? 0.28 : 0.3, ease: [0.16, 1, 0.3, 1] }}
             className="fixed top-0 right-0 w-full sm:w-[400px] z-[60] flex flex-col shadow-2xl overflow-hidden bg-surface-container-low border-l border-white/10"
             style={{ height: viewportHeight, willChange: "transform", transform: "translateZ(0)", contain: "layout style paint" }}
           >
            {chatContent}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
