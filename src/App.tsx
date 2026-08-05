/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { doc, setDoc, deleteDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./lib/firebase";
import { 
  Radio, 
  Calendar, 
  Mic, 
  Music, 
  MessageSquare, 
  Search, 
  Compass, 
  ChevronRight, 
  ChevronLeft,
  HelpCircle, 
  Globe, 
  Clock, 
  Flame, 
  ArrowRight,
  ExternalLink,
  Plus,
  Play,
  Pause,
  X,
  PartyPopper,
  MapPin,
  CalendarDays,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import UthLogo from "./components/UthLogo";
import { 
  WEEKLY_SCHEDULE_GR, 
  WEEKLY_SCHEDULE_EN, 
  SHOWS_DESCRIPTIONS_GR, 
  SHOWS_DESCRIPTIONS_EN, 
  ARCHIVE_ITEMS_GR, 
  ARCHIVE_ITEMS_EN, 
  EXTRA_ARCHIVE_ITEMS_GR, 
  EXTRA_ARCHIVE_ITEMS_EN 
} from "./data/radioData";

import MainPlayer from "./components/MainPlayer";
import LiveChat from "./components/LiveChat";
import UthLogo from "./components/UthLogo";

export default function App() {
  const [activeTab, setActiveTabState] = useState<"home" | "program" | "descriptions" | "archive" | "events" | "contact">("home");
  const setActiveTab = (tab: "home" | "program" | "descriptions" | "archive" | "events" | "contact") => {
    setActiveTabState(tab);
    setSelectedShowId(null);
  };
  const [isGreek, setIsGreek] = useState(true);
  const [stationPlaying, setStationPlaying] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  
  const [activeTrackId, setActiveTrackId] = useState<string>("");
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);

  // Light / Dark Theme toggle state
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("frs_theme") as "dark" | "light") || "dark";
  });

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
    localStorage.setItem("frs_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Contact form state
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", category: "general", message: "" });

  // Prevent background scrolling on mobile/desktop when show description modal is open
  useEffect(() => {
    if (selectedShowId) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedShowId]);

  // Global site presence: registers exactly once per browser tab instance
  const siteTabId = useMemo(() => {
    const navEntries = window.performance?.getEntriesByType?.("navigation") as PerformanceNavigationTiming[];
    const isReload = navEntries && navEntries.length > 0 && navEntries[0].type === "reload";
    
    let id = sessionStorage.getItem("frs_global_site_tab_id");
    if (!id || !isReload) {
      id = "site_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();
      sessionStorage.setItem("frs_global_site_tab_id", id);
    }
    return id;
  }, []);

  useEffect(() => {
    const presenceRef = doc(db, "site_presence", siteTabId);
    
    const registerPresence = () => {
      setDoc(presenceRef, {
        sessionId: siteTabId,
        timestamp: Date.now(),
        lastActive: serverTimestamp()
      }, { merge: true }).catch(() => {});
    };
    
    registerPresence();
    const interval = setInterval(registerPresence, 15000); // Heartbeat every 15s

    const handleUnload = () => {
      deleteDoc(presenceRef).catch(() => {});
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleUnload);
      deleteDoc(presenceRef).catch(() => {});
    };
  }, [siteTabId]);

  // Ticker to re-evaluate live show status every 10 seconds (so show transitions happen immediately)
  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Dynamically compute live, next, and later shows according to current day and exact time
  const { currentLiveShow, nextShow, laterShow } = useMemo(() => {
    const now = new Date();
    const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const todayAbbr = daysMap[now.getDay()];
    
    // Always use original show titles (WEEKLY_SCHEDULE_EN) so show names are NEVER translated
    const todayProgram = WEEKLY_SCHEDULE_EN.find(d => d.day === todayAbbr) || WEEKLY_SCHEDULE_EN[0];
    const shows = todayProgram.shows;
    
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    
    let active: any = null;
    let next: any = null;
    let later: any = null;
    
    for (let i = 0; i < shows.length; i++) {
      const show = shows[i];
      const parts = show.time.split("-").map(s => s.trim());
      if (parts.length === 2) {
        const [startH, startM] = parts[0].split(":").map(Number);
        const [endH, endM] = parts[1].split(":").map(Number);
        let startMin = startH * 60 + startM;
        let endMin = endH * 60 + endM;
        if (endMin <= startMin) endMin += 24 * 60; // handles past midnight
        
        if (nowMinutes >= startMin && nowMinutes < endMin) {
          active = show;
          next = shows[i + 1] || null;
          later = shows[i + 2] || null;
          break;
        } else if (startMin > nowMinutes && !next) {
          next = show;
          later = shows[i + 1] || null;
        } else if (startMin > nowMinutes && next && !later) {
          later = show;
        }
      }
    }
    
    // If next or later is null (no more shows today), look ahead to tomorrow and subsequent days
    if (!next || !later) {
      for (let offset = 1; offset <= 7; offset++) {
        const nextDayIdx = (now.getDay() + offset) % 7;
        const nextDayAbbr = daysMap[nextDayIdx];
        const nextDayProgram = WEEKLY_SCHEDULE_EN.find(d => d.day === nextDayAbbr);
        const nextDayProgramGR = WEEKLY_SCHEDULE_GR.find(d => d.day === (["Κυρ", "Δευ", "Τρι", "Τετ", "Πεμ", "Παρ", "Σαβ"][nextDayIdx]));
        
        if (nextDayProgram && nextDayProgram.shows && nextDayProgram.shows.length > 0) {
          const nextDayShows = nextDayProgram.shows;
          for (let j = 0; j < nextDayShows.length; j++) {
            const candidate = nextDayShows[j];
            const isTomorrow = offset === 1;
            const dayName = isTomorrow 
              ? (isGreek ? "Αύριο" : "Tomorrow") 
              : (isGreek ? (nextDayProgramGR?.fullName || nextDayAbbr) : nextDayProgram.fullName);
              
            const candidateWithLabel = {
              ...candidate,
              timeLabel: `${dayName} • ${candidate.time}`
            };

            if (!next) {
              next = candidateWithLabel;
            } else if (!later) {
              later = candidateWithLabel;
              break;
            }
          }
          if (next && later) break;
        }
      }
    }
    
    return { currentLiveShow: active, nextShow: next, laterShow: later };
  }, [isGreek, nowTick]);

  // Grid filter state for Weekly Program day selector on mobile
  const [selectedMobileDay, setSelectedMobileDay] = useState(0);

  // Search & sorting state for Mixcloud Archive
  const [archiveSearch, setArchiveSearch] = useState("");
  const [archiveFilter, setArchiveFilter] = useState("newest");
  const [loadedMore, setLoadedMore] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);

  // Text contents dictionaries
  const t = {
    gr: {
      navHome: "Αρχική",
      navProgram: "Πρόγραμμα & Εκπομπές",
      navArchive: "Αρχείο Mixcloud",
      listenBtn: "Ακρόαση",
      playingBtn: "Σε αναπαραγωγή",
      undergroundSub: "Φοιτητική Ραδιοφωνική Εκπομπή. Φτιαγμένη από φοιτητές, για φοιτητές. Συντονιστείτε για underground beats, νέα και αστείρευτη ενέργεια.",
      pulseTitle: "Ο Ηχητικός Παλμός του Campus.",
      todaysSchedule: "Το Πρόγραμμα Σήμερα",
      fullProgram: "Πλήρες Πρόγραμμα",
      liveIndicator: "ΖΩΝΤΑΝΑ",
      nextIndicator: "ΕΠΟΜΕΝΟ",
      studentsOnline: "142 Φοιτητές Online",
      joinedCommunity: "Live Chat",
      secUnder: "Εξερευνήστε το FRS UTH Ecosystem",
      leadDesc: "Βουτήξτε βαθιά στα ηχητικά τοπία των φοιτητών μας. Ανακαλύψτε τις φωνές που διαμορφώνουν τον ηλεκτρικό μας παλμό.",
      archiveHeader: "Αρχείο Εκπομπών",
      archiveSub: "Βουτήξτε στο αρχείο μας. Παλιές εκπομπές, θρύλικά sets και αυθεντική φοιτητική ενέργεια, αποθηκευμένα στο Mixcloud.",
      searchPlaceholder: "Αναζήτηση εκπομπών, DJs, ειδών...",
      sortNewest: "Πιο Πρόσφατα",
      sortPopular: "Πιο Δημοφιλή",
      loadMore: "Φόρτωση Περισσότερων",
      loading: "Φόρτωση...",
      noResults: "Δεν βρέθηκαν αποτελέσματα.",
      listenMixcloud: "Ακούστε στο Mixcloud",
      navEvents: "Εκδηλώσεις",
      eventsHeader: "Εκδηλώσεις",
      eventsSub: "Μάθε τι συμβαίνει στην πανεπιστημιακή κοινότητα. Πάρτι, live sets, workshops και πολλά ακόμα.",
      eventsUpcoming: "Επερχόμενες",
      eventsPast: "Προηγούμενες"
    },
    en: {
      navHome: "Home",
      navProgram: "Schedule & Shows",
      navArchive: "Mixcloud Archive",
      listenBtn: "Listen Live",
      playingBtn: "Playing",
      undergroundSub: "Foititika Radio Show UTH. Built for students, by students. Tune in for underground beats, campus news, and raw energy.",
      pulseTitle: "The Sonic Pulse of Campus.",
      todaysSchedule: "Today's Schedule",
      fullProgram: "View Full Program",
      liveIndicator: "LIVE",
      nextIndicator: "NEXT",
      studentsOnline: "142 Students Online",
      joinedCommunity: "Live Chat",
      secUnder: "Explore the FRS UTH Ecosystem",
      leadDesc: "Dive deep into the sonic landscapes curated by our student broadcasters. Discover the voices shaping our electric pulse.",
      archiveHeader: "Archive Vault",
      archiveSub: "Dive into the vault. Past broadcasts, legendary sets, and raw student energy, preserved on Mixcloud.",
      searchPlaceholder: "Search shows, DJs, genres...",
      sortNewest: "Newest First",
      sortPopular: "Most Popular",
      loadMore: "Load More Archives",
      loading: "Loading...",
      noResults: "No archives found.",
      listenMixcloud: "Listen on Mixcloud",
      navEvents: "Events",
      eventsHeader: "Events",
      eventsSub: "Find out what's happening in the campus community. Parties, live sets, workshops, and more.",
      eventsUpcoming: "Upcoming",
      eventsPast: "Past"
    }
  };

  const currentT = isGreek ? t.gr : t.en;

  // Language automatic detection or simple configuration
  const toggleLanguage = () => {
    setIsGreek(!isGreek);
  };

  const handleTabChange = (tab: "home" | "program" | "archive" | "events" | "contact") => {
    setActiveTab(tab);
    setSelectedShowId(null);
  };

  // Helper triggers to tune channel from any show block clicking
  const handleTuneChannel = (trackId: string) => {
    setActiveTrackId(trackId);
    setStationPlaying(true);
  };

  // Helper function to resolve any show ID or title to a guaranteed ShowDescription object
  const getShowDetails = (idOrTitle: string) => {
    const showsData = isGreek ? SHOWS_DESCRIPTIONS_GR : SHOWS_DESCRIPTIONS_EN;
    if (!idOrTitle) return showsData[0];

    // 1. Direct ID match in SHOWS_DESCRIPTIONS
    let show = showsData.find(s => s.id === idOrTitle);
    if (show) return show;


    // 3. Match by title substring
    show = showsData.find(s => 
      s.title.toLowerCase().trim() === idOrTitle.toLowerCase().trim() ||
      s.title.toLowerCase().includes(idOrTitle.toLowerCase()) ||
      idOrTitle.toLowerCase().includes(s.title.toLowerCase())
    );
    if (show) return show;

    // 4. Fallback lookup in WEEKLY_SCHEDULE to dynamically generate a show description
    const allWeeklyShows = (isGreek ? WEEKLY_SCHEDULE_GR : WEEKLY_SCHEDULE_EN).flatMap(d => d.shows);
    const weeklyShow = allWeeklyShows.find(s => s.id === idOrTitle || s.title === idOrTitle);

    if (weeklyShow) {
      return {
        id: weeklyShow.id,
        title: weeklyShow.title,
        host: weeklyShow.host,
        description: isGreek 
          ? `Ζωντανή εκπομπή "${weeklyShow.title}" στο FRS UTH με παραγωγό ${weeklyShow.host}. Συντονιστείτε για τις καλύτερες μουσικές επιλογές.`
          : `Live show "${weeklyShow.title}" on FRS UTH hosted by ${weeklyShow.host}. Tune in for the finest music rotation.`,
        tags: weeklyShow.tags || ["#Radio", "#FRSUTH"],
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCfQcIPRCRZHMyP7lgBeoLWCNigZYS9HGX0Hx1vBCA9KepoZ8uiIHHITJXTIR0pQJDjK63klAJZkUWrD5mFchtDjbBvLGeO1LVchmNBvTC5ZfI94R99GPqt1VuLok94oJFLDEM5R7wwVGve1vdCntt5D0SnL3yQZaSv7xTHVccNp36B0f_ZRPsPJJ-ZXXpk_YbQPQmKjapmI7YdDgQpFqzYecIAMHCUMOvnd9OnCz7QZ7EMUTYjXreqnIfPMS9qDdPNgP2oFJ3thrk"
      };
    }

    // 5. Default fallback to first description
    return showsData[0];
  };

  // Navigate to Show Descriptions page when clicking any podcast card
  const handleOpenShowDescription = (show: { id: string; title: string; host?: string }) => {
    if (!show) return;
    setSelectedShowId(show.id || show.title);
    setActiveTabState("program");
  };

  // Archive data logic
  const archiveBase = isGreek ? ARCHIVE_ITEMS_GR : ARCHIVE_ITEMS_EN;
  const archiveExtra = isGreek ? EXTRA_ARCHIVE_ITEMS_GR : EXTRA_ARCHIVE_ITEMS_EN;
  const fullArchive = loadedMore ? [...archiveBase, ...archiveExtra] : archiveBase;

  // Filter archive items by search
  const filteredArchive = fullArchive.filter((item) => {
    const term = archiveSearch.toLowerCase();
    const matchTitle = item.title.toLowerCase().includes(term);
    const matchDesc = item.description.toLowerCase().includes(term);
    const matchTags = item.tags.some(t => t.toLowerCase().includes(term));
    return matchTitle || matchDesc || matchTags;
  });

  // Archive simulator load more
  const handleLoadMore = () => {
    setArchiveLoading(true);
    setTimeout(() => {
      setLoadedMore(true);
      setArchiveLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container flex flex-col relative pb-40 md:pb-36 overflow-x-hidden">
      
      {/* FLOATING AMBIENT AURORA GLASS ORBS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{
            x: [0, 80, -40, 0],
            y: [0, -60, 40, 0],
            scale: [1, 1.25, 0.9, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 left-[15%] w-[480px] h-[480px] bg-[#d2f34c]/12 rounded-full filter blur-[140px] animate-aurora"
        />
        <motion.div
          animate={{
            x: [0, -70, 50, 0],
            y: [0, 80, -30, 0],
            scale: [1, 0.85, 1.15, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[35%] right-[10%] w-[550px] h-[550px] bg-white/[0.04] rounded-full filter blur-[140px] animate-aurora"
        />
        <motion.div
          animate={{
            x: [0, 60, -50, 0],
            y: [0, -50, 60, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[10%] left-[25%] w-[500px] h-[500px] bg-[#c1e436]/10 rounded-full filter blur-[150px] animate-aurora"
        />
      </div>

      {/* HEADER SECTION (Desktop) */}
      <nav className="w-full sticky top-0 glass-navbar transition-all duration-300 z-40">
        <div className="flex justify-between items-center px-6 py-4 max-w-screen-xl mx-auto w-full">
          <div 
            onClick={() => handleTabChange("home")}
            className="cursor-pointer"
          >
            <UthLogo size={34} showText={true} />
          </div>
          
          <ul className="hidden md:flex gap-8 font-semibold text-sm">
            <li className="cursor-pointer">
              <span 
                onClick={() => handleTabChange("home")}
                className={`transition-all pb-1 ${
                  activeTab === "home" 
                    ? "text-primary border-b-2 border-primary glow-text" 
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {currentT.navHome}
              </span>
            </li>
            <li className="cursor-pointer">
              <span 
                onClick={() => handleTabChange("program")}
                className={`transition-all pb-1 ${
                  activeTab === "program" 
                    ? "text-primary border-b-2 border-primary glow-text" 
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {currentT.navProgram}
              </span>
            </li>
            <li className="cursor-pointer">
              <span 
                onClick={() => handleTabChange("descriptions")}
                className={`transition-all pb-1 ${
                  activeTab === "descriptions" 
                    ? "text-primary border-b-2 border-primary glow-text" 
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {currentT.navDesc}
              </span>
            </li>
            <li className="cursor-pointer">
              <span 
                onClick={() => handleTabChange("archive")}
                className={`transition-all pb-1 ${
                  activeTab === "archive" 
                    ? "text-primary border-b-2 border-primary glow-text" 
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {currentT.navArchive}
              </span>
            </li>
          </ul>

          <div className="flex items-center gap-3">
            {/* LIGHT / DARK MODE TOGGLE BUTTON */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-9 h-9 rounded-full glass-pill text-on-surface-variant hover:text-primary transition-all cursor-pointer shadow-xs"
              title={theme === "dark" ? (isGreek ? "Αλλαγή σε Φωτεινό Θέμα" : "Switch to Light Mode") : (isGreek ? "Αλλαγή σε Σκοτεινό Θέμα" : "Switch to Dark Mode")}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>
            {/* LINGUAL TOGGLE BUTTON */}
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full glass-pill text-xs text-on-surface hover:text-primary font-semibold shadow-xs cursor-pointer"
              title={isGreek ? "Switch to English" : "Αλλαγή σε Ελληνικά"}
            >
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span>{isGreek ? "EN" : "GR"}</span>
            </button>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleTuneChannel("m3")}
              className="hidden md:flex items-center gap-2 bg-primary text-on-primary px-5 py-2 rounded-full font-bold text-xs shadow-lg shadow-primary/20 cursor-pointer"
            >
              <Music className="w-3.5 h-3.5" />
              <span>{stationPlaying ? currentT.playingBtn : currentT.listenBtn}</span>
            </motion.button>
          </div>
        </div>
      </nav>

      {/* MAIN RENDER CORE */}
      <main className="flex-grow max-w-screen-xl mx-auto w-full px-6 flex flex-col items-center mt-6 pb-32 md:pb-36 z-10 relative">
        <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <motion.div
              key="home"
              id="view-home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full flex flex-col items-center gap-12"
            >
              {/* HERO CARD PORTION */}
              <motion.header
                initial={{ opacity: 0, scale: 0.94, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-center max-w-4xl glass-panel p-8 md:p-12 rounded-3xl flex flex-col items-center gap-5 mt-4 relative overflow-hidden group shadow-2xl border border-white/15"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
                
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                  className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-pill text-xs font-bold text-primary uppercase tracking-widest shadow-xs"
                >
                  <Flame className="w-3.5 h-3.5 text-primary animate-bounce" />
                  <span>24/7 LIVE CAMPUS BROADCAST</span>
                </motion.span>

                <h1 className="font-headline text-5xl md:text-7xl tracking-tighter text-primary font-extrabold leading-tight glow-text">
                  {currentT.pulseTitle}
                </h1>
                
                <p className="text-lg text-on-surface-variant leading-relaxed font-normal max-w-2xl">
                  {currentT.undergroundSub}
                </p>

                {/* CENTRAL PLAY EMBLEM - APPLE LIQUID GLASS STYLE */}
                <div className="relative mt-6 flex flex-col items-center gap-7">
                  <div className="relative flex justify-center items-center">
                    {stationPlaying && (
                      <>
                        <div className="absolute -inset-6 rounded-full border-2 border-primary/45 animate-ping opacity-40"></div>
                        <div className="absolute -inset-10 rounded-full border border-primary/30 animate-pulse opacity-30"></div>
                      </>
                    )}
                    <div className="absolute -inset-4 rounded-full bg-[#d2f34c]/25 filter blur-3xl animate-pulse"></div>
                    <motion.button
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setStationPlaying(!stationPlaying)}
                      id="hero-play-accent"
                      className="w-26 h-26 rounded-full bg-gradient-to-b from-white/25 to-white/5 p-[1px] flex items-center justify-center shadow-[0_24px_50px_rgba(0,0,0,0.8),_0_0_40px_rgba(210,243,76,0.35)] cursor-pointer relative z-10 group"
                    >
                      <div className="w-full h-full rounded-full bg-[#141418]/90 backdrop-blur-3xl group-hover:bg-[#1f1f25]/95 transition-all flex items-center justify-center border border-white/10">
                        {stationPlaying ? (
                          <Pause className="w-10 h-10 text-[#d2f34c] fill-[#d2f34c] drop-shadow-[0_0_15px_rgba(210,243,76,0.7)]" />
                        ) : (
                          <Play className="w-10 h-10 text-[#d2f34c] fill-[#d2f34c] drop-shadow-[0_0_15px_rgba(210,243,76,0.7)] ml-1" />
                        )}
                      <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Instagram className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">Social Media</h4>
                      <p className="text-xs text-on-surface-variant mt-1">
                        <a href="https://www.instagram.com/frsvolou.gr/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1 font-semibold">
                          <span>Instagram (@frsvolou.gr)</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </p>
                      <p className="text-xs text-on-surface-variant mt-1">
                        <a href="https://www.mixcloud.com/frs-volou/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1 font-semibold">
                          <span>Mixcloud (frs-volou)</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
                    </motion.button>
                  </div>

                  {/* INTERACTIVE COMMUNITY CHAT TRIGGER */}
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setChatOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-full glass-pill text-xs font-bold text-primary transition-all cursor-pointer shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{currentT.joinedCommunity}</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                    </motion.button>
                  </div>
                </div>
              </motion.header>

              {/* TODAY'S / WEEKLY SCHEDULE ROW - MOVED ABOVE LIVE CHAT */}
              <section className="w-full max-w-4xl flex flex-col gap-5 mt-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h2 className="font-headline text-xl font-bold text-primary tracking-tight flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <span>{isGreek ? "Επόμενες εκπομπές" : "Up next"}</span>
                  </h2>
                  <button 
                    onClick={() => handleTabChange("program")}
                    className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>{currentT.fullProgram}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* LIVE CARD */}
                  <div 
                    onClick={() => currentLiveShow && handleOpenShowDescription(currentLiveShow)}
                    className="glass-card p-5 rounded-2xl border border-primary/50 relative overflow-hidden glow-primary shadow-xl group transition-all duration-200 cursor-pointer hover:border-primary hover:scale-[1.01]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-transparent pointer-events-none" />
                    <div className="relative z-10 flex flex-col gap-2.5">
                      {currentLiveShow ? (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-primary font-mono">{currentLiveShow.time}</span>
                            <div className="flex items-center gap-1.5 bg-primary/25 px-2.5 py-0.5 rounded-full text-[10px] text-primary font-bold uppercase backdrop-blur-md shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                              <span>{currentT.liveIndicator}</span>
                            </div>
                          </div>
                          <h3 className="font-headline text-lg font-bold text-primary mt-1 group-hover:underline">{currentLiveShow.title}</h3>
                          <p className="text-xs text-on-surface-variant font-medium">{currentLiveShow.host}</p>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-on-surface-variant font-mono">24/7 Non-Stop</span>
                            <div className="flex items-center gap-1.5 bg-outline-variant/30 px-2.5 py-0.5 rounded-full text-[10px] text-on-surface-variant font-bold uppercase backdrop-blur-md">
                              <span>{isGreek ? "ΑΥΤΟΜΑΤΗ ΡΟΗ" : "AUTO STREAM"}</span>
                            </div>
                          </div>
                          <h3 className="font-headline text-base md:text-lg font-bold text-primary mt-1">
                            {isGreek ? "Δεν μεταδίδεται ζωντανή εκπομπή αυτή τη στιγμή" : "No Live Show Broadcast Right Now"}
                          </h3>
                          <p className="text-xs text-on-surface-variant font-medium">
                            {isGreek ? "Αυτόματη μουσική ροή FRS UTH 24/7" : "FRS UTH 24/7 Automated Music Rotation"}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* NEXT CARD */}
                  <div 
                    onClick={() => nextShow && handleOpenShowDescription(nextShow)}
                    className="glass-card p-5 rounded-2xl border border-white/10 transition-all duration-200 shadow-lg group cursor-pointer hover:border-primary/50 hover:scale-[1.01]"
                  >
                    <div className="flex flex-col gap-2.5">
                      {nextShow ? (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-on-surface-variant font-mono">{nextShow.timeLabel || nextShow.time}</span>
                            <span className="text-[10px] font-bold text-on-surface-variant/80 border border-white/15 px-2 py-0.5 rounded uppercase glass-pill">
                              {currentT.nextIndicator}
                            </span>
                          </div>
                          <h3 className="font-headline text-lg font-bold text-primary mt-1 group-hover:underline">{nextShow.title}</h3>
                          <p className="text-xs text-on-surface-variant font-medium">{nextShow.host}</p>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-on-surface-variant font-mono">--:--</span>
                            <span className="text-[10px] font-bold text-on-surface-variant/80 border border-white/15 px-2 py-0.5 rounded uppercase glass-pill">
                              {currentT.nextIndicator}
                            </span>
                          </div>
                          <h3 className="font-headline text-lg font-bold text-primary mt-1">
                            {isGreek ? "Καμία επόμενη για σήμερα" : "No More Shows Today"}
                          </h3>
                          <p className="text-xs text-on-surface-variant font-medium">
                            {isGreek ? "Δείτε το εβδομαδιαίο πρόγραμμα" : "Check weekly schedule"}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* LATER CARD */}
                  <div 
                    onClick={() => laterShow && handleOpenShowDescription(laterShow)}
                    className="glass-card p-5 rounded-2xl border border-white/10 transition-all duration-200 shadow-lg group cursor-pointer hover:border-primary/50 hover:scale-[1.01]"
                  >
                    <div className="flex flex-col gap-2.5">
                      {laterShow ? (
                        <>
                          <span className="text-xs font-semibold text-on-surface-variant font-mono">{laterShow.timeLabel || laterShow.time}</span>
                          <h3 className="font-headline text-lg font-bold text-primary mt-1 group-hover:underline">{laterShow.title}</h3>
                          <p className="text-xs text-on-surface-variant font-medium">{laterShow.host}</p>
                        </>
                      ) : (
                        <>
                          <span className="text-xs font-semibold text-on-surface-variant font-mono">24/7</span>
                          <h3 className="font-headline text-lg font-bold text-primary mt-1">
                            {isGreek ? "Αυτόματη Ροή Μουσικής" : "Auto Rotation Continues"}
                          </h3>
                          <p className="text-xs text-on-surface-variant font-medium">
                            {isGreek ? "Μουσικές επιλογές 24/7" : "24/7 Curated Tracks"}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* LIVE COMMUNITY TICKER & PREVIEW CARD - REPLACING BULKY INLINE CHAT */}
              <section className="w-full max-w-4xl flex flex-col mt-4">
                <div 
                  onClick={() => setChatOpen(true)}
                  className="glass-panel p-6 md:p-8 rounded-3xl border border-white/15 hover:border-primary/50 transition-all duration-300 shadow-xl cursor-pointer group relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent pointer-events-none" />
                  
                  <div className="flex flex-col gap-3 max-w-xl relative z-10 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                      <span className="text-xs font-bold font-mono text-primary uppercase tracking-widest">
                        {isGreek ? "ΖΩΝΤΑΝΗ ΚΟΙΝΟΤΗΤΑ FRS" : "LIVE FRS COMMUNITY"}
                      </span>
                      <span className="tag-badge ml-1">
                        142 {isGreek ? "Φοιτητές Online" : "Students Online"}
                      </span>
                    </div>
                    
                    <h3 className="font-headline text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight group-hover:text-primary transition-colors">
                      {isGreek ? "Συντονιστείτε & Μιλήστε On-Air με τους Παραγωγούς" : "Tune In & Chat On-Air With Our Broadcasters"}
                    </h3>
                    
                    {/* Simulated live ticker comments */}
                    <div className="flex flex-col gap-2 mt-1">
                      <div className="flex items-center gap-2 text-xs bg-white/[0.04] px-3.5 py-2 rounded-xl border border-white/10 text-on-surface-variant">
                        <span className="font-bold text-primary font-mono">DJ Nova:</span>
                        <span className="truncate">{isGreek ? "Ετοιμάζω μερικά φρέσκα Techno κομμάτια για απόψε! ⚡" : "Dropping some fresh techno tracks tonight! Who's ready? ⚡"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs bg-white/[0.04] px-3.5 py-2 rounded-xl border border-white/10 text-on-surface-variant">
                        <span className="font-bold text-[#f97758] font-mono">Sarah V.:</span>
                        <span className="truncate">{isGreek ? "Ανυπομονώ για το αυριανό Indie Hour! Στείλτε παραγγελίες 🎧" : "Can't wait for Indie Hour tomorrow! Send your requests 🎧"}</span>
                      </div>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={(e) => { e.stopPropagation(); setChatOpen(true); }}
                    className="flex items-center gap-3 bg-primary text-on-primary font-bold text-sm px-7 py-4 rounded-full shadow-lg shadow-primary/20 flex-shrink-0 cursor-pointer group-hover:brightness-105 transition-all"
                  >
                    <MessageSquare className="w-4 h-4 fill-on-primary" />
                    <span>{isGreek ? "Άνοιγμα Συνομιλίας" : "Open Community Chat"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === "program" && (
            <motion.div
              key="program"
              id="view-weekly-program"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full flex flex-col items-center gap-8"
            >
              <header className="text-center max-w-3xl glass-panel p-8 rounded-3xl flex flex-col items-center gap-3 border border-white/15 shadow-xl">
                <h1 className="font-headline text-4xl md:text-5xl tracking-tight text-primary font-bold glow-text">
                  {isGreek ? "Εβδομαδιαίο Πρόγραμμα" : "Weekly Program"}
                </h1>
                <p className="text-base text-on-surface-variant max-w-xl">
                  {isGreek 
                    ? "Συντονιστείτε στον ηχητικό παλμό της φοιτητικής μας εκπομπής. High-energy beats, βαθιές αναλύσεις και επιλογές όλη την εβδομάδα."
                    : "Tune in to the sonic pulse of our student-led broadcasting. High-energy beats, deep dives, and eclectic mixes all week long."}
                </p>
              </header>

              {/* UNIFIED DAY HORIZONTAL SCROLL SELECTOR (DESKTOP & MOBILE) */}
              <div className="flex overflow-x-auto gap-2 pb-3 w-full no-scrollbar justify-start md:justify-center snap-x">
                {(isGreek ? WEEKLY_SCHEDULE_GR : WEEKLY_SCHEDULE_EN).map((dayProg, idx) => (
                  <button
                    key={dayProg.day}
                    onClick={() => setSelectedMobileDay(idx)}
                    className={`snap-start flex-shrink-0 px-6 py-3 rounded-full font-bold text-xs transition-all border cursor-pointer ${
                      selectedMobileDay === idx
                        ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/25 scale-105"
                        : "glass-pill text-on-surface hover:border-primary/50"
                    }`}
                  >
                    {dayProg.day}
                  </button>
                ))}
              </div>

              {/* SPACIOUS SHOWS GRID FOR SELECTED DAY */}
              <div className="w-full flex flex-col gap-4 mt-2 max-w-5xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 px-1">
                  <h3 className="font-headline text-xl font-bold text-primary tracking-tight">
                    {(isGreek ? WEEKLY_SCHEDULE_GR : WEEKLY_SCHEDULE_EN)[selectedMobileDay].fullName}
                  </h3>
                  <span className="text-xs font-mono text-on-surface-variant font-semibold">
                    {(isGreek ? WEEKLY_SCHEDULE_GR : WEEKLY_SCHEDULE_EN)[selectedMobileDay].shows.length} {isGreek ? "Εκπομπές" : "Shows"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full items-stretch">
                  {(isGreek ? WEEKLY_SCHEDULE_GR : WEEKLY_SCHEDULE_EN)[selectedMobileDay].shows.map((show) => (
                    <div
                      key={show.id}
                      onClick={() => handleTuneChannel(show.id)}
                      className={`p-6 rounded-3xl border flex flex-col justify-between gap-5 transition-all duration-300 shadow-xl cursor-pointer group ${
                        show.isLive
                          ? "glass-card border-primary/80 bg-primary/20 glow-primary"
                          : "glass-card border-white/15 hover:border-primary/50 hover:-translate-y-1"
                      }`}
                    >
                      <div className="flex flex-col gap-3.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-mono font-bold text-on-surface-variant/95 bg-white/[0.06] px-3 py-1 rounded-lg border border-white/10">
                            {show.time}
                          </span>
                          {show.isLive && (
                            <span className="flex items-center gap-1.5 text-[10px] text-primary font-bold bg-primary/25 px-2.5 py-1 rounded-full uppercase border border-primary/40 shadow-xs">
                              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                              <span>{currentT.liveIndicator}</span>
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="font-headline text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                            {show.title}
                          </h4>
                          <p className="text-xs text-on-surface-variant font-semibold mt-1">
                            {show.host}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-3.5 border-t border-white/10">
                        {show.tags.map(tag => (
                          <span key={tag} className="tag-badge">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "descriptions" && (
            <AnimatePresence mode="wait">
              {selectedShowId ? (() => {
                const showsData = isGreek ? SHOWS_DESCRIPTIONS_GR : SHOWS_DESCRIPTIONS_EN;
                const selectedShow = showsData.find(s => s.id === selectedShowId);
                if (!selectedShow) return null;
                const getMockTracks = (showId: string) => {
                  if (showId === "desc1") {
                    return [
                      { title: "Ocean Breeze (Original Mix)", artist: "Atmos Deep", duration: "6:24" },
                      { title: "Late Night Conversationalist", artist: "Minimalist Club", duration: "5:12" },
                      { title: "Dream Reflections", artist: "Nostalgic Echo", duration: "4:45" },
                    ];
                  }
                  if (showId === "desc2") {
                    return [
                      { title: "Soul Provider (7'' Single edit)", artist: "The Funk Apostles", duration: "3:40" },
                      { title: "Crate Digging Delights", artist: "DJ Sarah", duration: "4:15" },
                      { title: "Groovy Vinyl Reverie", artist: "Wax Collectors", duration: "5:02" },
                    ];
                  }
                  if (showId === "desc3") {
                    return [
                      { title: "Dusk Til Dawn (Live Session)", artist: "The Campus Band", duration: "3:58" },
                      { title: "Electric Horizon", artist: "Unsigned Hype", duration: "4:01" },
                      { title: "Alternative Vibes", artist: "Sarah & the Waves", duration: "3:22" },
                    ];
                  }
                  if (showId === "desc4") {
                    return [
                      { title: "Resonance (Vector Remix)", artist: "Bassline Syndicate", duration: "5:50" },
                      { title: "Frequency Overload", artist: "Modulate", duration: "6:10" },
                      { title: "Acid Rain (Hardmix)", artist: "Sub Zero", duration: "4:55" },
                    ];
                  }
                  return [
                    { title: "Sunrise Harmony", artist: "Indie Pop Collective", duration: "3:12" },
                    { title: "College Coffee Break", artist: "Acoustic Duo", duration: "2:45" },
                    { title: "Morning Dew", artist: "Soft Breeze", duration: "3:30" },
                  ];
                };
                const recTracks = getMockTracks(selectedShow.id);
                return (
                  <motion.div
                    key={`show-page-${selectedShow.id}`}
                    id="view-single-show-description"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-4xl flex flex-col gap-6"
                  >
                    {/* Return back button */}
                    <button
                      onClick={() => setSelectedShowId(null)}
                      className="flex items-center gap-2 text-xs text-on-surface-variant hover:text-primary transition-all cursor-pointer mr-auto glass-pill px-4.5 py-2.5 rounded-full font-bold shadow-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>{isGreek ? "Πίσω στις Περιγραφές" : "Back to Shows"}</span>
                    </button>

                    {/* Show Main Hero Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 glass-panel rounded-3xl p-6 md:p-8 border border-white/15 shadow-2xl overflow-hidden relative">
                      {/* Left Block - Huge image showcase */}
                      <div className="md:col-span-5 flex flex-col gap-4">
                        <div className="aspect-[4/3] md:aspect-square w-full rounded-2xl overflow-hidden border border-white/15 relative group shadow-lg bg-surface-container-highest">
                          <img
                            src={selectedShow.image}
                            alt={selectedShow.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-out"
                          />
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
                        </div>

                        {/* Tune in call to action button */}
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleTuneChannel(selectedShow.id)}
                          className="w-full bg-primary text-on-primary font-bold py-3.5 px-6 rounded-full hover:brightness-105 transition-all flex items-center justify-center gap-3.5 cursor-pointer shadow-lg shadow-primary/20"
                        >
                          <Play className="w-5 h-5 fill-on-primary" />
                          <span>{isGreek ? "Συντονισμός & Ακρόαση" : "Tune & Listen"}</span>
                        </motion.button>
                      </div>

                      {/* Right Block - Deep details */}
                      <div className="md:col-span-7 flex flex-col gap-5 justify-between">
                        <div className="flex flex-col gap-4">
                          <div>
                            <div className="flex flex-wrap gap-1.5 mb-2.5">
                              {selectedShow.tags.map(tag => (
                                <span key={tag} className="tag-badge">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <h2 className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight leading-tight glow-text">
                              {selectedShow.title}
                            </h2>
                            <p className="text-sm text-primary font-semibold mt-1">
                              {isGreek ? "Παραγωγός" : "Hosted by"}: {selectedShow.host}
                            </p>
                          </div>

                          {/* Show long descriptive body text */}
                          <div className="flex flex-col gap-2">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-mono">
                              {isGreek ? "Σχετικά με την Εκπομπή" : "About the Show"}
                            </h4>
                            <p className="text-sm text-on-surface-variant leading-relaxed">
                              {selectedShow.description}
                            </p>
                          </div>

                          {/* Broadcast Schedule slot */}
                          <div className="flex flex-col gap-2 glass-card p-4 rounded-2xl border border-white/10 mt-1">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant font-mono flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              <span>{isGreek ? "Ημέρα & Ώρα Μετάδοσης" : "Broadcasting Schedule"}</span>
                            </h4>
                            <p className="text-xs font-bold text-on-surface">
                              {selectedShow.id === "desc1" && (isGreek ? "Κάθε Δευτέρα στις 18:00 - 20:00" : "Every Monday at 18:00 - 20:00")}
                              {selectedShow.id === "desc2" && (isGreek ? "Κάθε Τρίτη στις 16:00 - 18:00" : "Every Tuesday at 16:00 - 18:00")}
                              {selectedShow.id === "desc3" && (isGreek ? "Κάθε Τετάρτη στις 15:00 - 17:00" : "Every Wednesday at 15:00 - 17:00")}
                              {selectedShow.id === "desc4" && (isGreek ? "Κάθε Πέμπτη στις 20:00 - 22:00" : "Every Thursday at 20:00 - 22:00")}
                              {selectedShow.id === "desc5" && (isGreek ? "Κάθε Παρασκευή στις 22:00 - 00:00" : "Every Friday at 22:00 - 00:00")}
                              {(!["desc1", "desc2", "desc3", "desc4", "desc5"].includes(selectedShow.id)) && (isGreek ? "Σαββατοκύριακο στις 18:00 - 20:00" : "Weekend Special at 18:00 - 20:00")}
                            </p>
                          </div>
                        </div>

                        {/* Recent On-Air spin history inside detailed subpage */}
                        <div className="flex flex-col gap-3 pt-3 border-t border-white/10 mt-3">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-mono">
                            {isGreek ? "Πρόσφατα στο On-Air Playlist" : "Recent On-Air Playlist"}
                          </h4>
                          <div className="flex flex-col gap-2">
                            {recTracks.map((item, index) => (
                              <div key={index} className="flex items-center justify-between text-xs py-2 px-3.5 glass-card rounded-xl hover:border-primary/40 transition-colors">
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                  <span className="text-[10px] font-mono text-primary font-bold w-4">0{index + 1}</span>
                                  <div className="flex flex-col leading-normal truncate">
                                    <span className="font-bold text-on-surface truncate">{item.title}</span>
                                    <span className="text-[10px] text-on-surface-variant/80 truncate">{item.artist}</span>
                                  </div>
                                </div>
                                <span className="font-mono text-[10px] text-on-surface-variant/70 ml-2">{item.duration}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })() : (
                <motion.div
                  key="descriptions"
                  id="view-show-descriptions"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full flex flex-col items-center gap-8"
                >
                  <header className="w-full text-center max-w-4xl flex flex-col items-center gap-3 glass-panel p-8 rounded-3xl border border-white/15 shadow-xl">
                    <h1 className="font-headline text-4xl md:text-5xl tracking-tight text-primary font-bold glow-text">
                      {currentT.secUnder}
                    </h1>
                    <p className="text-base text-on-surface-variant max-w-2xl">
                      {currentT.leadDesc}
                    </p>
                  </header>

                  <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
                    {(isGreek ? SHOWS_DESCRIPTIONS_GR : SHOWS_DESCRIPTIONS_EN).map((desc) => (
                      <article
                        key={desc.id}
                        onClick={() => setSelectedShowId(desc.id)}
                        className="glass-card rounded-2xl overflow-hidden group border border-white/15 hover:border-primary/50 transition-all duration-300 flex flex-col cursor-pointer hover:shadow-2xl hover:shadow-primary/15"
                      >
                        <div className="h-52 relative overflow-hidden bg-surface-container-highest">
                          <img 
                            src={desc.image} 
                            alt={desc.title} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out opacity-85 group-hover:opacity-100"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-90" />
                        </div>

                        <div className="p-6 flex flex-col gap-3 flex-grow z-10 relative mt-[-24px] bg-background/85 backdrop-blur-xl border-t border-white/10 rounded-t-2xl">
                          <div>
                            <h3 className="font-headline text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                              {desc.title}
                            </h3>
                            <p className="text-xs text-on-surface-variant font-semibold mt-1">Hosted by {desc.host}</p>
                          </div>

                          <p className="text-xs text-on-surface-variant leading-relaxed flex-grow select-none">
                            {desc.description}
                          </p>

                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {desc.tags.map(tag => (
                              <span key={tag} className="tag-badge">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </article>
                    ))}
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {activeTab === "archive" && (
            <motion.div
              key="archive"
              id="view-mixcloud-archive"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full flex flex-col items-center gap-8"
            >
              <header className="text-center max-w-4xl flex flex-col items-center gap-4 glass-panel p-8 rounded-3xl border border-white/15 shadow-xl">
                <h1 className="font-headline text-4xl md:text-5xl tracking-tight text-primary font-bold glow-text">
                  {currentT.archiveHeader}
                </h1>
                <p className="text-base text-on-surface-variant max-w-xl">
                  {currentT.archiveSub}
                </p>

                {/* SEARCH Row */}
                <div className="flex gap-3 w-full max-w-md justify-center items-center mt-3">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 text-primary absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={archiveSearch}
                      onChange={(e) => setArchiveSearch(e.target.value)}
                      placeholder={currentT.searchPlaceholder}
                      className="w-full glass-pill rounded-full py-2.5 pl-11 pr-4 text-sm text-on-surface focus:outline-none focus:border-primary placeholder:text-on-surface-variant/50 transition-all shadow-inner"
                    />
                  </div>
                </div>
              </header>

              {/* ARCHIVE GRID DECK */}
              {filteredArchive.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
                  {filteredArchive.map((item) => (
                    <article
                      key={item.id}
                      onClick={() => handleTuneChannel(item.id)}
                      className="glass-card rounded-2xl p-4 border border-white/15 hover:border-primary/50 transition-all duration-300 group flex flex-col cursor-pointer hover:shadow-2xl hover:shadow-primary/10"
                    >
                      <div className="h-44 w-full bg-surface-container relative overflow-hidden rounded-xl mb-4">
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                        />
                        <div className="absolute bottom-3 left-3 flex gap-1">
                          {item.tags.map(tag => (
                            <span key={tag} className="tag-badge backdrop-blur-md">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="text-[11px] font-bold text-on-surface-variant group-hover:text-primary transition-colors uppercase tracking-wider mb-1">
                        {item.date}
                      </div>
                      
                      <h3 className="font-headline text-base font-bold text-primary mb-1 line-clamp-1">
                        {item.title}
                      </h3>
                      
                      <p className="text-xs text-on-surface-variant mb-6 line-clamp-2 leading-relaxed flex-grow">
                        {item.description}
                      </p>

                      <a 
                        href="#"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleTuneChannel(item.id); }}
                        className="inline-flex items-center gap-2 text-on-primary bg-primary font-bold text-xs px-4 py-2.5 rounded-full hover:scale-103 transition-all w-full justify-center mt-auto shadow-md shadow-primary/20"
                      >
                        <Radio className="w-3.5 h-3.5 fill-on-primary" />
                        <span>{currentT.listenMixcloud}</span>
                      </a>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 glass-card rounded-2xl p-8 max-w-md w-full border border-white/10">
                  <p className="text-on-surface-variant text-sm font-semibold">{currentT.noResults}</p>
                </div>
              )}

              {/* PAGINATION / LOAD MORE ACCENT */}
              {!loadedMore && filteredArchive.length > 0 && (
                <div className="mt-4 flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLoadMore}
                    disabled={archiveLoading}
                    className="font-bold text-xs text-on-surface hover:text-primary px-7 py-3 rounded-full glass-pill border border-white/20 hover:border-primary flex items-center gap-2 transition-all cursor-pointer shadow-lg"
                  >
                    <span>{archiveLoading ? currentT.loading : currentT.loadMore}</span>
                    {archiveLoading && (
                      <span className="animate-spin h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full" />
                    )}
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "events" && (
            <motion.div
              key="events"
              id="view-events"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full flex flex-col items-center gap-8"
            >
              <header className="text-center max-w-3xl glass-panel p-8 rounded-3xl flex flex-col items-center gap-3 border border-white/15 shadow-xl">
                <h1 className="font-headline text-4xl md:text-5xl tracking-tight text-primary font-bold glow-text">
                  {currentT.eventsHeader}
                </h1>
                <p className="text-base text-on-surface-variant max-w-xl">
                  {currentT.eventsSub}
                </p>
              </header>

              {/* UPCOMING EVENTS */}
              <div className="w-full max-w-4xl flex flex-col gap-5">
                <h2 className="font-headline text-lg font-bold text-primary flex items-center gap-2">
                  <Flame className="w-5 h-5 text-primary" />
                  {currentT.eventsUpcoming}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Event Card 1 */}
                  <div className="glass-card rounded-2xl border border-primary/40 overflow-hidden shadow-xl group hover:border-primary transition-all duration-200 hover:scale-[1.01]">
                    <div className="h-40 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent flex items-center justify-center relative">
                      <PartyPopper className="w-16 h-16 text-primary/60" />
                      <div className="absolute top-3 right-3 bg-primary text-on-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase shadow-lg">
                        {isGreek ? "ΣΥΝΤΟΜΑ" : "SOON"}
                      </div>
                    </div>
                    <div className="p-5 flex flex-col gap-2.5">
                      <h3 className="font-headline text-lg font-bold text-white">
                        {isGreek ? "FRS UTH Opening Party 2026" : "FRS UTH Opening Party 2026"}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <CalendarDays className="w-3.5 h-3.5 text-primary" />
                        <span>{isGreek ? "15 Οκτωβρίου 2026 • 21:00" : "October 15, 2026 • 9:00 PM"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span>{isGreek ? "Κεντρική Πλατεία Πανεπιστημίου" : "University Central Square"}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant/80 leading-relaxed mt-1">
                        {isGreek
                          ? "Το μεγάλο πάρτι έναρξης της νέας ραδιοφωνικής σεζόν! Live DJs, δωρεάν είσοδος και ατελείωτη ενέργεια."
                          : "The grand opening party for the new radio season! Live DJs, free entry, and endless energy."}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] text-primary font-bold">{isGreek ? "200+ ενδιαφερόμενοι" : "200+ interested"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Event Card 2 */}
                  <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-xl group hover:border-primary/50 transition-all duration-200 hover:scale-[1.01]">
                    <div className="h-40 bg-gradient-to-br from-[#b3be87]/20 via-transparent to-transparent flex items-center justify-center relative">
                      <Mic className="w-16 h-16 text-[#b3be87]/40" />
                      <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase border border-white/15">
                        {isGreek ? "ΕΓΓΡΑΦΕΣ" : "SIGN UP"}
                      </div>
                    </div>
                    <div className="p-5 flex flex-col gap-2.5">
                      <h3 className="font-headline text-lg font-bold text-white">
                        {isGreek ? "Workshop: Πώς να Φτιάξεις τη Δική σου Εκπομπή" : "Workshop: Build Your Own Radio Show"}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <CalendarDays className="w-3.5 h-3.5 text-primary" />
                        <span>{isGreek ? "22 Οκτωβρίου 2026 • 17:00" : "October 22, 2026 • 5:00 PM"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span>{isGreek ? "Studio FRS UTH, Κτίριο Β" : "FRS UTH Studio, Building B"}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant/80 leading-relaxed mt-1">
                        {isGreek
                          ? "Μάθε τα βασικά της ραδιοφωνικής παραγωγής. Από τεχνικά μέχρι παρουσίαση, σου δείχνουμε πώς να ξεκινήσεις."
                          : "Learn radio production basics. From technical setup to on-air presentation, we show you how to get started."}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] text-primary font-bold">{isGreek ? "30 θέσεις διαθέσιμες" : "30 spots available"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Event Card 3 */}
                  <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-xl group hover:border-primary/50 transition-all duration-200 hover:scale-[1.01]">
                    <div className="h-40 bg-gradient-to-br from-purple-500/15 via-transparent to-transparent flex items-center justify-center relative">
                      <Music className="w-16 h-16 text-purple-400/40" />
                      <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase border border-white/15">
                        {isGreek ? "ΔΩΡΕΑΝ" : "FREE"}
                      </div>
                    </div>
                    <div className="p-5 flex flex-col gap-2.5">
                      <h3 className="font-headline text-lg font-bold text-white">
                        {isGreek ? "Live Acoustic Night" : "Live Acoustic Night"}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <CalendarDays className="w-3.5 h-3.5 text-primary" />
                        <span>{isGreek ? "5 Νοεμβρίου 2026 • 20:00" : "November 5, 2026 • 8:00 PM"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span>{isGreek ? "Αίθουσα Εκδηλώσεων, Κτίριο Γ" : "Events Hall, Building C"}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant/80 leading-relaxed mt-1">
                        {isGreek
                          ? "Βραδιά ζωντανής ακουστικής μουσικής με φοιτητικά συγκροτήματα. Ανοιχτή σκηνή για όλους!"
                          : "Live acoustic music night with student bands. Open stage for everyone!"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] text-primary font-bold">{isGreek ? "85+ ενδιαφερόμενοι" : "85+ interested"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PAST EVENTS */}
              <div className="w-full max-w-4xl flex flex-col gap-5 mt-4">
                <h2 className="font-headline text-lg font-bold text-on-surface-variant flex items-center gap-2">
                  <Clock className="w-5 h-5 text-on-surface-variant" />
                  {currentT.eventsPast}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="glass-card rounded-2xl border border-white/5 p-4 flex flex-col gap-2 opacity-70">
                    <span className="text-[10px] font-mono text-on-surface-variant/60">{isGreek ? "12 Μαΐου 2026" : "May 12, 2026"}</span>
                    <h4 className="text-sm font-bold text-on-surface-variant">{isGreek ? "End of Season Party" : "End of Season Party"}</h4>
                    <p className="text-[10px] text-on-surface-variant/50">{isGreek ? "Κεντρική Πλατεία" : "Central Square"}</p>
                  </div>
                  <div className="glass-card rounded-2xl border border-white/5 p-4 flex flex-col gap-2 opacity-70">
                    <span className="text-[10px] font-mono text-on-surface-variant/60">{isGreek ? "28 Μαρτίου 2026" : "March 28, 2026"}</span>
                    <h4 className="text-sm font-bold text-on-surface-variant">{isGreek ? "DJ Battle Night" : "DJ Battle Night"}</h4>
                    <p className="text-[10px] text-on-surface-variant/50">{isGreek ? "Studio FRS UTH" : "FRS UTH Studio"}</p>
                  </div>
                  <div className="glass-card rounded-2xl border border-white/5 p-4 flex flex-col gap-2 opacity-70">
                    <span className="text-[10px] font-mono text-on-surface-variant/60">{isGreek ? "14 Φεβρουαρίου 2026" : "February 14, 2026"}</span>
                    <h4 className="text-sm font-bold text-on-surface-variant">{isGreek ? "Valentine's Music Marathon" : "Valentine's Music Marathon"}</h4>
                    <p className="text-[10px] text-on-surface-variant/50">{isGreek ? "Online Stream" : "Online Stream"}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "contact" && (
            <motion.div
              key="contact"
              id="view-contact"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full flex flex-col items-center gap-8"
            >
              <header className="text-center max-w-3xl glass-panel p-8 rounded-3xl flex flex-col items-center gap-3 border border-white/15 shadow-xl">
                <h1 className="font-headline text-4xl md:text-5xl tracking-tight text-primary font-bold glow-text">
                  {isGreek ? "Επικοινωνία" : "Contact Us"}
                </h1>
                <p className="text-base text-on-surface-variant max-w-xl">
                  {isGreek 
                    ? "Έχετε κάποια ερώτηση, μουσική πρόταση ή θέλετε να γίνετε μέλος της ομάδας του FRS UTH; Στείλτε μας μήνυμα!"
                    : "Have a question, music suggestion, or want to join the FRS UTH team? Send us a message!"}
                </p>
              </header>

              <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Contact Info Cards */}
                <div className="md:col-span-5 flex flex-col gap-4">
                  <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{isGreek ? "Το Studio Μας" : "Our Studio"}</h4>
                      <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                        {isGreek ? "Πανεπιστήμιο Θεσσαλίας" : "University of Thessaly"}<br />
                        {isGreek ? "Βόλος, Ελλάδα" : "Volos, Greece"}
                      </p>
                    </div>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">Email</h4>
                      <p className="text-xs text-on-surface-variant mt-1">
                        <a href="mailto:info@frsvolou.gr" className="hover:text-primary transition-colors">info@frsvolou.gr</a>
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        <a href="mailto:studio@frsvolou.gr" className="hover:text-primary transition-colors">studio@frsvolou.gr</a>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Form */}
                <div className="md:col-span-7 glass-panel p-6 md:p-8 rounded-3xl border border-white/15 shadow-xl">
                  {contactSubmitted ? (
                    <div className="flex flex-col items-center justify-center text-center py-10 gap-3">
                      <CheckCircle2 className="w-14 h-14 text-primary animate-bounce" />
                      <h3 className="font-headline text-2xl font-bold text-white">
                        {isGreek ? "Το μήνυμά σας στάλθηκε!" : "Message Sent!"}
                      </h3>
                      <p className="text-xs text-on-surface-variant max-w-sm">
                        {isGreek
                          ? "Ευχαριστούμε για την επικοινωνία. Η ομάδα του FRS UTH θα σας απαντήσει σύντομα!"
                          : "Thank you for reaching out. The FRS UTH team will get back to you soon!"}
                      </p>
                      <button
                        onClick={() => {
                          setContactSubmitted(false);
                          setContactForm({ name: "", email: "", category: "general", message: "" });
                        }}
                        className="mt-4 px-6 py-2.5 rounded-full bg-primary/20 text-primary font-bold text-xs hover:bg-primary hover:text-white transition-all cursor-pointer"
                      >
                        {isGreek ? "Σύνταξη νέου μηνύματος" : "Send Another Message"}
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setContactLoading(true);
                        try {
                          await addDoc(collection(db, "contact_messages"), {
                            name: contactForm.name,
                            email: contactForm.email,
                            category: contactForm.category,
                            message: contactForm.message,
                            createdAt: serverTimestamp()
                          });
                        } catch (err) {
                          console.error("Error saving contact message:", err);
                        }
                        
                        const subject = encodeURIComponent(`[FRS UTH Contact] ${contactForm.category.toUpperCase()} - ${contactForm.name}`);
                        const body = encodeURIComponent(`Όνομα: ${contactForm.name}\nEmail: ${contactForm.email}\nΚατηγορία: ${contactForm.category}\n\nΜήνυμα:\n${contactForm.message}`);
                        window.location.href = `mailto:info@frsvolou.gr?subject=${subject}&body=${body}`;

                        setContactLoading(false);
                        setContactSubmitted(true);
                      }}
                      className="flex flex-col gap-4"
                    >
                      <h3 className="font-headline text-xl font-bold text-white mb-1">
                        {isGreek ? "Στείλτε Μήνυμα" : "Send a Message"}
                      </h3>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 font-mono">
                          {isGreek ? "Όνομα" : "Name"}
                        </label>
                        <input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          placeholder={isGreek ? "Το όνομά σας" : "Your name"}
                          className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 font-mono">
                          Email
                        </label>
                        <input
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          placeholder="your.email@example.com"
                          className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 font-mono">
                          {isGreek ? "Κατηγορία" : "Category"}
                        </label>
                        <select
                          value={contactForm.category}
                          onChange={(e) => setContactForm({ ...contactForm, category: e.target.value })}
                          className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-all cursor-pointer"
                        >
                          <option value="general">{isGreek ? "Γενική Ερώτηση" : "General Query"}</option>
                          <option value="join">{isGreek ? "Συμμετοχή στο Ραδιόφωνο" : "Join the Radio Team"}</option>
                          <option value="technical">{isGreek ? "Τεχνικό Θέμα" : "Technical Issue"}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 font-mono">
                          {isGreek ? "Μήνυμα" : "Message"}
                        </label>
                        <textarea
                          required
                          rows={4}
                          value={contactForm.message}
                          onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                          placeholder={isGreek ? "Γράψτε το μήνυμά σας εδώ..." : "Write your message here..."}
                          className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-all resize-none"
                        />
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={contactLoading}
                        className="w-full bg-primary text-on-primary font-bold py-3 px-6 rounded-xl hover:brightness-105 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/25 mt-2"
                      >
                        {contactLoading ? (
                          <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>{isGreek ? "Αποστολή Μηνύματος" : "Send Message"}</span>
                          </>
                        )}
                      </motion.button>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="w-full py-12 flex flex-col items-center gap-4 px-6 relative z-10 mt-auto border-t border-outline-variant/10 bg-transparent">
        <UthLogo size={36} showText={true} />
        <ul className="flex gap-6 text-xs text-on-surface-variant/60 font-semibold mt-2">
          <li><a href="https://www.instagram.com/frsvolou.gr/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-all">Instagram</a></li>
          <li><button onClick={() => handleTabChange("contact")} className="hover:text-primary transition-all cursor-pointer">Contact</button></li>
          <li><a href="https://www.mixcloud.com/frs-volou/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-all">Mixcloud</a></li>
        </ul>
        <div className="text-[10px] text-on-surface-variant/40 mt-1">
          © FRS-UTH. Foititika Radio Show. Built for students, by students.
        </div>
      </footer>

      {/* PERSISTENT FLOATING CHAT BALLOON (Apple Liquid Glass Style) */}
      {!chatOpen && (
        <motion.button
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.92 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          onClick={() => setChatOpen(true)}
          id="persistent-chat-trigger"
          className="fixed bottom-[145px] md:bottom-[88px] right-6 z-[55] w-14 h-14 bg-[#d2f34c] text-[#181c08] rounded-full shadow-[0_15px_35px_rgba(210,243,76,0.45)] hover:shadow-[0_20px_45px_rgba(210,243,76,0.65)] flex items-center justify-center cursor-pointer border border-white/40"
          title={isGreek ? "Άνοιγμα Συνομιλίας" : "Open Chat"}
        >
          <MessageSquare className="w-6 h-6 text-[#181c08] fill-[#181c08]" />
        </motion.button>
      )}

      {/* BOTTOM NAVIGATION NAV-BAR (Mobile view matches screen mock references) */}
      <nav className="fixed bottom-0 left-0 w-full z-45 flex justify-around items-center px-4 py-3 md:hidden glass-navbar rounded-t-3xl border-t border-white/15 pb-7 shadow-[0_-10px_30px_rgba(0,0,0,0.6)]">
        <button 
          onClick={() => { handleTabChange("home"); }}
          className={`flex flex-col items-center justify-center p-2 rounded-full transition-all cursor-pointer ${
            activeTab === "home" ? "text-primary scale-110 drop-shadow-[0_0_8px_rgba(210,243,76,0.6)]" : "text-on-surface-variant"
          }`}
        >
          <Radio className="w-5 h-5" />
        </button>
        <button 
          onClick={() => { handleTabChange("program"); }}
          className={`flex flex-col items-center justify-center p-2 rounded-full transition-all cursor-pointer ${
            activeTab === "program" ? "text-primary scale-110 drop-shadow-[0_0_8px_rgba(210,243,76,0.6)]" : "text-on-surface-variant"
          }`}
        >
          <Calendar className="w-5 h-5" />
        </button>
        <button 
          onClick={() => { handleTabChange("descriptions"); }}
          className={`flex flex-col items-center justify-center p-2 rounded-full transition-all cursor-pointer ${
            activeTab === "descriptions" ? "text-primary scale-110 drop-shadow-[0_0_8px_rgba(210,243,76,0.6)]" : "text-on-surface-variant"
          }`}
        >
          <Mic className="w-5 h-5" />
        </button>
        <button 
          onClick={() => { handleTabChange("archive"); }}
          className={`flex flex-col items-center justify-center p-2 rounded-full transition-all cursor-pointer ${
            activeTab === "archive" ? "text-primary scale-110 drop-shadow-[0_0_8px_rgba(210,243,76,0.6)]" : "text-on-surface-variant"
          }`}
        >
          <Music className="w-5 h-5" />
        </button>
      </nav>

      {/* TOP-LEVEL SHOW DESCRIPTION MODAL OVERLAY */}
      <AnimatePresence>
        {selectedShowId && (() => {
          const selectedShow = getShowDetails(selectedShowId);
          if (!selectedShow) return null;
          return (
            <div 
              onClick={() => setSelectedShowId(null)}
              className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto overscroll-contain"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl bg-[#181112] border border-white/20 rounded-3xl p-5 md:p-7 shadow-2xl relative max-h-[82vh] md:max-h-[85vh] overflow-y-auto my-auto overscroll-contain"
              >
                {/* Close button */}
                <button
                  onClick={() => setSelectedShowId(null)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-primary text-white flex items-center justify-center transition-all cursor-pointer border border-white/10 z-20"
                  title={isGreek ? "Κλείσιμο" : "Close"}
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Show Details Content */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Image & Tune CTA */}
                  <div className="md:col-span-5 flex flex-col gap-4">
                    <div className="aspect-square w-full rounded-2xl overflow-hidden border border-white/15 relative group shadow-lg bg-surface-container-highest max-w-[260px] mx-auto md:max-w-none">
                      <img
                        src={selectedShow.image}
                        alt={selectedShow.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        handleTuneChannel(selectedShow.id);
                        setSelectedShowId(null);
                      }}
                      className="w-full bg-primary text-on-primary font-bold py-3 px-5 rounded-xl hover:brightness-105 transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-primary/25"
                    >
                      <Play className="w-4 h-4 fill-on-primary" />
                      <span>{isGreek ? "Συντονισμός & Ακρόαση" : "Tune & Listen"}</span>
                    </motion.button>
                  </div>

                  {/* Text Info */}
                  <div className="md:col-span-7 flex flex-col gap-4">
                    <div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {selectedShow.tags.map(tag => (
                          <span key={tag} className="text-[10px] bg-primary/20 text-primary px-2.5 py-0.5 rounded-full font-bold">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h2 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                        {selectedShow.title}
                      </h2>
                      <p className="text-xs text-primary font-semibold mt-1">
                        {isGreek ? "Παραγωγός" : "Hosted by"}: {selectedShow.host}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant font-mono">
                        {isGreek ? "Σχετικά με την Εκπομπή" : "About the Show"}
                      </h4>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {selectedShow.description}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5 bg-white/[0.04] p-3.5 rounded-xl border border-white/10">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant font-mono flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>{isGreek ? "Ημέρα & Ώρα Μετάδοσης" : "Broadcasting Schedule"}</span>
                      </h4>
                      <p className="text-xs font-bold text-white">
                        {(() => {
                          const schedule = isGreek ? WEEKLY_SCHEDULE_GR : WEEKLY_SCHEDULE_EN;
                          for (const day of schedule) {
                            const match = day.shows.find(s => s.id === selectedShow.id);
                            if (match) {
                              return isGreek
                                ? `Κάθε ${day.fullName} στις ${match.time}`
                                : `Every ${day.fullName} at ${match.time}`;
                            }
                          }
                          return isGreek ? "Ειδική Εκπομπή" : "Special Broadcast";
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* INTEGRATED SLIDING SIDEBAR CHAT PANEL */}
      <LiveChat 
        isGreek={isGreek} 
        isOpen={chatOpen} 
        onClose={() => setChatOpen(false)} 
        onActiveTrackTrigger={handleTuneChannel}
        currentLiveShow={currentLiveShow}
      />

      {/* PERSISTENT LIVE AUDIO STREAM CONTROLLER */}
      <MainPlayer 
        isGreek={isGreek} 
        stationPlaying={stationPlaying} 
        setStationPlaying={setStationPlaying} 
        activeTrackId={activeTrackId}
        currentLiveShow={currentLiveShow}
      />

    </div>
  );
}
