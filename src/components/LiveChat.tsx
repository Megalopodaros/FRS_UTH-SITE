/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  X, 
  Edit3, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  Play, 
  Pause, 
  Radio, 
  Music, 
  Sparkles, 
  Users,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ChatMessage } from "../types";
import { collection, addDoc, query, limit, onSnapshot, serverTimestamp, getDocs, deleteDoc, orderBy } from "firebase/firestore";
import { db, rtdb } from "../lib/firebase";
import { ref, onValue, onDisconnect, set } from "firebase/database";

interface LiveChatProps {
  isGreek: boolean;
  isOpen: boolean;
  onClose: () => void;
  onActiveTrackTrigger?: (trackId: string) => void;
  isInline?: boolean;
  currentLiveShow?: any;
  stationPlaying?: boolean;
  setStationPlaying?: (playing: boolean) => void;
}

const TAB_NAME_KEY = "frs_tab_user_name";
const TAB_COLOR_KEY = "frs_tab_avatar_color";
const TAB_SESSION_KEY = "frs_tab_session_id";

const AVATAR_COLORS = [
  "#DF3B2B",
  "#E06D53",
  "#D97706",
  "#059669",
  "#0284C7",
  "#7C3AED",
  "#DB2777",
  "#4B5563"
];

const QUICK_EMOJIS = ["🔥", "❤️", "🎧", "⚡", "👏", "📻", "🎉", "🚀", "✨", "🎵"];

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
  setStationPlaying
}: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [userName, setUserName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [onlineCount, setOnlineCount] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 768 : false));

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

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

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
            avatarColor: data.avatarColor || "#DF3B2B",
            sessionId: data.sessionId
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

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = (customText || inputText).trim();
    if (!textToSend) return;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const sessionId = sessionStorage.getItem(TAB_SESSION_KEY) || "guest";

    try {
      if (!customText) setInputText("");
      await addDoc(collection(db, "messages"), {
        user: userName,
        text: textToSend,
        timestamp: timeStr,
        avatarColor: avatarColor,
        sessionId: sessionId,
        createdAt: serverTimestamp()
      });

      // Play soft pop sound if enabled
      if (soundEnabled) {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
        } catch {}
      }
    } catch (err) {
      console.error("Error sending message to Firestore:", err);
    }
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
      localStorage.setItem(TAB_NAME_KEY, tempName.trim());
    }
    setIsEditingName(false);
  };

  const currentSessionId = sessionStorage.getItem(TAB_SESSION_KEY);

  const displayShowTitle = currentLiveShow?.title || (isGreek ? "Αυτόματη Ροή FRS UTH" : "FRS UTH Auto Stream");
  const displayShowHost = currentLiveShow ? currentLiveShow.host : "24/7 Campus Radio Rotation";

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className={`fixed inset-0 z-50 overflow-hidden ${
            isMobile 
              ? "flex justify-end" 
              : "flex items-center justify-center p-4 sm:p-6 lg:p-8"
          }`}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
          />

          {/* Large Desktop Floating Window (w-full max-w-5xl) vs Mobile Slide-Over */}
          <motion.div
            initial={isMobile ? { x: "100%" } : { opacity: 0, scale: 0.93, y: 25 }}
            animate={isMobile ? { x: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isMobile ? { x: "100%" } : { opacity: 0, scale: 0.93, y: 25 }}
            transition={{
              type: "spring",
              damping: isMobile ? 28 : 24,
              stiffness: isMobile ? 280 : 300
            }}
            onClick={(e) => e.stopPropagation()}
            className={`relative bg-[#F7F4EC] shadow-2xl flex flex-col z-10 ${
              isMobile
                ? "w-full max-w-md h-full border-l border-black/10"
                : "w-full max-w-4xl lg:max-w-5xl h-[750px] max-h-[88vh] rounded-3xl border border-black/10 overflow-hidden my-auto"
            }`}
          >
            {/* Top Bar for Desktop */}
            <div className="bg-white px-6 py-4 border-b border-black/10 flex items-center justify-between shadow-xs shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#FEECEB] text-[#DF3B2B] flex items-center justify-center font-bold shadow-xs border border-[#F7C8C4]/60 shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-base sm:text-lg text-[#1C1917]">
                      {isGreek ? "Live Chat Κοινότητας" : "Community Live Chat"}
                    </h3>
                    <span className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {onlineCount} {isGreek ? "online" : "online"}
                    </span>
                  </div>
                  <p className="text-xs text-[#78716C] mt-0.5">
                    {displayShowTitle} • {displayShowHost}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="text-[#78716C] hover:text-[#1C1917] p-2 rounded-full hover:bg-[#F7F4EC] transition-colors cursor-pointer"
                  title={soundEnabled ? "Mute chat sounds" : "Enable chat sounds"}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-[#DF3B2B]" />}
                </button>
                <button
                  onClick={onClose}
                  className="text-[#78716C] hover:text-[#1C1917] p-2 rounded-full hover:bg-[#F7F4EC] transition-colors cursor-pointer"
                  title={isGreek ? "Κλείσιμο (Esc)" : "Close (Esc)"}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Desktop 2-Column Split: Main Chat (Left) & Integrated Live Mini-Player Panel (Right) */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
              
              {/* LEFT: Main Chat Stream & Inputs */}
              <div className="flex-1 flex flex-col min-h-0 bg-[#F7F4EC] border-r-0 md:border-r border-black/[0.08]">
                
                {/* User Profile Bar (Rename / Color) */}
                <div className="bg-white/80 px-5 sm:px-6 py-2.5 border-b border-black/[0.06] flex items-center justify-between text-xs shrink-0">
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
                        className="bg-[#DF3B2B] text-white font-bold px-3 py-1 rounded-lg text-xs hover:bg-[#C62F20] transition-colors cursor-pointer"
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
                        <span className="font-semibold text-[#1C1917] truncate max-w-[200px]">
                          {userName}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setTempName(userName);
                          setIsEditingName(true);
                        }}
                        className="text-[#DF3B2B] hover:text-[#C62F20] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isGreek ? "Αλλαγή ονόματος" : "Edit Name"}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#78716C]">
                      <MessageSquare className="w-14 h-14 text-[#DF3B2B]/30 mb-3" />
                      <p className="font-bold text-base sm:text-lg text-[#1C1917]">
                        {isGreek ? "Καλώς ήρθατε στο FRS UTH Chat!" : "Welcome to FRS UTH Chat!"}
                      </p>
                      <p className="text-xs sm:text-sm mt-1 max-w-sm leading-relaxed">
                        {isGreek 
                          ? "Γίνετε οι πρώτοι που θα στείλουν μήνυμα στους υπόλοιπους φοιτητές και ακροατές της πανεπιστημιακής κοινότητας." 
                          : "Be the first to say hi to your fellow students and listeners across campus."}
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.sessionId === currentSessionId;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 px-1">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: msg.avatarColor || "#DF3B2B" }}
                            />
                            <span className="text-[11px] font-bold text-[#1C1917]">
                              {msg.user}
                            </span>
                            <span className="text-[10px] text-[#78716C] font-mono">
                              {msg.timestamp}
                            </span>
                          </div>
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-xs break-words ${
                              isMe
                                ? "bg-[#DF3B2B] text-white rounded-tr-xs"
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

                {/* Quick Emoji Bar */}
                <div className="bg-white/90 px-4 sm:px-6 py-2.5 border-t border-black/[0.06] flex items-center justify-between gap-1 overflow-x-auto shrink-0">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleSendMessage(undefined, emoji)}
                      className="p-1.5 text-xl hover:scale-125 transition-transform cursor-pointer rounded-lg hover:bg-[#F7F4EC]"
                      title={`Send ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
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
                    className="field py-3 px-4 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="w-12 h-12 rounded-2xl bg-[#DF3B2B] hover:bg-[#C62F20] text-white flex items-center justify-center shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-[#DF3B2B]/20 cursor-pointer"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </form>

              </div>

              {/* RIGHT / SIDEBAR (Desktop): Live Audio Mini-Player & Broadcast Card */}
              <div className="w-full md:w-80 lg:w-96 bg-[#FAF8F4] flex flex-col justify-between p-5 sm:p-6 shrink-0 border-t md:border-t-0 border-black/[0.08]">
                
                {/* Station Broadcast Visual Card */}
                <div className="flex flex-col gap-4">
                  
                  {/* On Air Card */}
                  <div className="relative rounded-2xl overflow-hidden shadow-lg border border-black/10 aspect-video sm:aspect-[16/10] bg-stone-900 group">
                    <img
                      src="/hero-studio.jpg"
                      alt="Broadcast Studio"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#DF3B2B] text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                      <span className={`w-1.5 h-1.5 rounded-full bg-white ${stationPlaying ? "animate-ping" : ""}`} />
                      <span>ON AIR</span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h4 className="font-bold text-sm sm:text-base leading-tight truncate">
                        {displayShowTitle}
                      </h4>
                      <p className="text-xs text-stone-300 truncate mt-0.5">
                        {displayShowHost}
                      </p>
                    </div>
                  </div>

                  {/* Station Info Box */}
                  <div className="bg-white rounded-2xl p-4 border border-black/[0.06] shadow-xs flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#6B6560]">
                      <span className="flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-[#DF3B2B]" />
                        <span>FRS UTH Radio</span>
                      </span>
                      <span className="font-mono text-[11px] text-[#DF3B2B]">320 KBPS</span>
                    </div>
                    <p className="text-xs text-[#6B6560] leading-relaxed">
                      {isGreek 
                        ? "Ακούτε ζωντανά τη φοιτητική ραδιοφωνική κοινότητα του Πανεπιστημίου Θεσσαλίας." 
                        : "Streaming live from the University of Thessaly student broadcast studio."}
                    </p>
                  </div>
                </div>

                {/* MINI PLAY BAR IN CHAT WINDOW */}
                <div className="mt-5 bg-white rounded-2xl p-4 border border-black/[0.08] shadow-md flex items-center justify-between gap-3">
                  
                  {/* Play / Pause Button */}
                  <button
                    onClick={() => setStationPlaying && setStationPlaying(!stationPlaying)}
                    className="w-12 h-12 rounded-xl bg-[#DF3B2B] hover:bg-[#C62F20] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#DF3B2B]/20 transition-transform active:scale-95 cursor-pointer"
                    aria-label={stationPlaying ? "Pause stream" : "Play live radio"}
                  >
                    {stationPlaying ? (
                      <Pause className="w-5 h-5 fill-white text-white" />
                    ) : (
                      <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                    )}
                  </button>

                  {/* Track info & Animated Equalizer Bars */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#1C1917] truncate">
                        {stationPlaying ? (isGreek ? "Αναπαραγωγή Live" : "Streaming Live") : (isGreek ? "Σε παύση" : "Paused")}
                      </span>
                      
                      {/* Animated Soundwave Equalizer */}
                      {stationPlaying && (
                        <div className="flex items-end gap-0.5 h-3.5">
                          <span className="w-1 bg-[#DF3B2B] rounded-full animate-wave-1" />
                          <span className="w-1 bg-[#DF3B2B] rounded-full animate-wave-2" />
                          <span className="w-1 bg-[#DF3B2B] rounded-full animate-wave-3" />
                          <span className="w-1 bg-[#DF3B2B] rounded-full animate-wave-4" />
                        </div>
                      )}
                    </div>

                    <span className="text-[11px] text-[#78716C] truncate mt-0.5 font-medium">
                      {displayShowTitle}
                    </span>
                  </div>

                </div>

              </div>

            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
