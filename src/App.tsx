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
  Search, 
  ArrowRight,
  ExternalLink,
  Play,
  Pause,
  X,
  MapPin,
  Mail,
  CheckCircle2,
  Send,
  MessageSquare,
  Clock,
  Music,
  Globe,
  Sparkles,
  ChevronRight,
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import UthLogo from "./components/UthLogo";
import MainPlayer from "./components/MainPlayer";
import LiveChat from "./components/LiveChat";
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

type TabId = "home" | "program" | "events" | "archive" | "contact";

export default function App() {
  const [activeTab, setActiveTabState] = useState<TabId>("home");
  const [isGreek, setIsGreek] = useState(true);
  const [stationPlaying, setStationPlaying] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeTrackId, setActiveTrackId] = useState<string>("");
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);
  const [isOpenCallModalOpen, setIsOpenCallModalOpen] = useState(false);

  const setActiveTab = (tab: TabId) => {
    setActiveTabState(tab);
    setSelectedShowId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Contact / Open Call form state
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", category: "join", message: "" });

  // Open Call modal form
  const [openCallSubmitted, setOpenCallSubmitted] = useState(false);
  const [openCallLoading, setOpenCallLoading] = useState(false);
  const [openCallForm, setOpenCallForm] = useState({ name: "", email: "", showConcept: "", musicGenres: "", phone: "" });

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (selectedShowId || isOpenCallModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedShowId, isOpenCallModalOpen]);

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

  // Ticker to re-evaluate live show status every 10 seconds
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
        if (endMin <= startMin) endMin += 24 * 60;
        
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
  const [loadedMore, setLoadedMore] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);

  // Text contents dictionaries
  const t = {
    gr: {
      navHome: "Αρχική",
      navProgram: "Πρόγραμμα & Εκπομπές",
      navEvents: "Εκδηλώσεις",
      navArchive: "Αρχείο Mixcloud",
      listenBtn: "ΑΚΡΟΑΣΗ",
      playingBtn: "ΠΑΙΖΕΙ ΤΩΡΑ",
      heroTag: "LIVE ON AIR • 24/7 MUSIC STREAM",
      heroTitle1: "Ο Ηχητικός Παλμός",
      heroTitle2: "του Campus.",
      heroSub: "Φοιτητική Ραδιοφωνική Κοινότητα Πανεπιστημίου Θεσσαλίας. Φτιαγμένη από φοιτητές, για φοιτητές. Συντονιστείτε σε underground sets, debate panels και αυθεντική ενέργεια.",
      listenLive: "Ακούστε Ζωντανά",
      liveChat: "Live Chat",
      stat1: "24/7",
      stat1Sub: "Online Ροή",
      stat2: "40+",
      stat2Sub: "Παραγωγοί",
      stat3: "100%",
      stat3Sub: "Ανεξάρτητο",
      nowOnAir: "ΤΩΡΑ ΣΤΟΝ ΑΕΡΑ",
      studioLocation: "Volos Studio A",
      autoStreamTitle: "Αυτόματη Ροή FRS UTH",
      autoStreamSub: "Non-Stop Eclectic Music Selection",
      upcomingShowsTag: "ΕΠΟΜΕΝΕΣ ΕΚΠΟΜΠΕΣ",
      todaysScheduleTitle: "Το Σημερινό Πρόγραμμα",
      fullWeekLink: "Πλήρες Πρόγραμμα Εβδομάδας →",
      noLiveShow: "Δεν μεταδίδεται ζωντανή εκπομπή αυτή τη στιγμή",
      autoStreamDesc: "Συνεχής αναπαραγωγή curated playlist από την μουσική ομάδα του FRS UTH.",
      eventsTag: "ΔΡΑΣΤΗΡΙΟΤΗΤΕΣ & PARTIES",
      eventsTitle: "Εκδηλώσεις του Σταθμού",
      eventsDesc: "Από acoustic live sessions στο campus μέχρι DJ sets στα φοιτητικά στέκια, ο FRS UTH ενώνει τη φοιτητική κοινότητα μέσα από τη μουσική και τη δράση.",
      openCallBadge: "OPEN CALL 2026",
      openCallTitle: "Θέλεις τη δική σου εκπομπή;",
      openCallSub: "Οι αιτήσεις για νέους ραδιοφωνικούς παραγωγούς του επόμενου εξαμήνου άνοιξαν. Γίνε μέλος της ομάδας μας.",
      applyNow: "Κάνε Αίτηση Τώρα",
      footerDesc: "Φοιτητικός Ραδιοφωνικός Σταθμός Πανεπιστημίου Θεσσαλίας. Αυτόνομη έκφραση, μουσική πρωτοπορία και επικοινωνία φοιτητών από το 2010.",
      cities: "Βόλος • Λάρισα • Τρίκαλα • Καρδίτσα • Λαμία",
      navTitle: "ΠΛΟΗΓΗΣΗ",
      connectTitle: "ΣΥΝΔΕΘΕΙΤΕ",
      connectText: "Ακούστε τα archived sets και podcast επεισόδια στο επίσημο κανάλι μας.",
      mixcloudBtn: "Mixcloud Channel",
      copyright: "© 2026 FRS UTH • Φοιτητικός Ραδιοφωνικός Σταθμός Πανεπιστημίου Θεσσαλίας.",
      terms: "Όροι Χρήσης",
      privacy: "Πολιτική Απορρήτου"
    },
    en: {
      navHome: "Home",
      navProgram: "Schedule & Shows",
      navEvents: "Events",
      navArchive: "Mixcloud Archive",
      listenBtn: "LISTEN LIVE",
      playingBtn: "NOW PLAYING",
      heroTag: "LIVE ON AIR • 24/7 MUSIC STREAM",
      heroTitle1: "The Sonic Pulse of",
      heroTitle2: "Campus.",
      heroSub: "University of Thessaly Student Radio Community. Made by students, for students. Tune in for underground sets, debate panels, and raw authentic energy.",
      listenLive: "Listen Live",
      liveChat: "Live Chat",
      stat1: "24/7",
      stat1Sub: "Online Stream",
      stat2: "40+",
      stat2Sub: "Producers",
      stat3: "100%",
      stat3Sub: "Independent",
      nowOnAir: "NOW ON AIR",
      studioLocation: "Volos Studio A",
      autoStreamTitle: "FRS UTH Automated Stream",
      autoStreamSub: "Non-Stop Eclectic Music Selection",
      upcomingShowsTag: "UPCOMING BROADCASTS",
      todaysScheduleTitle: "Today's Schedule",
      fullWeekLink: "Full Weekly Schedule →",
      noLiveShow: "No live broadcast currently on air",
      autoStreamDesc: "Continuous curated rotation from the FRS UTH music department.",
      eventsTag: "ACTIVITIES & PARTIES",
      eventsTitle: "Station Events",
      eventsDesc: "From acoustic live sessions on campus to DJ sets across student hotspots, FRS UTH unites the university through sound and action.",
      openCallBadge: "OPEN CALL 2026",
      openCallTitle: "Want your own radio show?",
      openCallSub: "Applications for new student radio hosts and producers for next semester are now open. Join our team.",
      applyNow: "Apply Now",
      footerDesc: "Student Radio Station of the University of Thessaly. Autonomous expression, musical forefront, and student connection since 2010.",
      cities: "Volos • Larissa • Trikala • Karditsa • Lamia",
      navTitle: "NAVIGATION",
      connectTitle: "CONNECT",
      connectText: "Listen to archived sets and podcast episodes on our official channel.",
      mixcloudBtn: "Mixcloud Channel",
      copyright: "© 2026 FRS UTH • Student Radio Station of the University of Thessaly.",
      terms: "Terms of Use",
      privacy: "Privacy Policy"
    }
  };

  const currentT = isGreek ? t.gr : t.en;

  const handleTuneChannel = (trackId: string) => {
    setActiveTrackId(trackId);
    setStationPlaying(true);
  };

  const getShowDetails = (idOrTitle: string) => {
    const showsData = isGreek ? SHOWS_DESCRIPTIONS_GR : SHOWS_DESCRIPTIONS_EN;
    if (!idOrTitle) return showsData[0];

    let show = showsData.find(s => s.id === idOrTitle);
    if (show) return show;

    show = showsData.find(s => 
      s.title.toLowerCase().trim() === idOrTitle.toLowerCase().trim() ||
      s.title.toLowerCase().includes(idOrTitle.toLowerCase()) ||
      idOrTitle.toLowerCase().includes(s.title.toLowerCase())
    );
    if (show) return show;

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
        image: "/hero-studio.jpg"
      };
    }

    return showsData[0];
  };

  const handleOpenShowDescription = (show: { id: string; title: string; host?: string }) => {
    if (!show) return;
    setSelectedShowId(show.id || show.title);
  };

  // Archive data
  const archiveBase = isGreek ? ARCHIVE_ITEMS_GR : ARCHIVE_ITEMS_EN;
  const archiveExtra = isGreek ? EXTRA_ARCHIVE_ITEMS_GR : EXTRA_ARCHIVE_ITEMS_EN;
  const fullArchive = loadedMore ? [...archiveBase, ...archiveExtra] : archiveBase;

  const filteredArchive = fullArchive.filter((item) => {
    const term = archiveSearch.toLowerCase();
    return (
      item.title.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.tags.some(t => t.toLowerCase().includes(term))
    );
  });

  const handleLoadMore = () => {
    setArchiveLoading(true);
    setTimeout(() => {
      setLoadedMore(true);
      setArchiveLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F7F4EC] text-[#1C1917] flex flex-col selection:bg-[#DF3B2B]/20 selection:text-[#DF3B2B]">
      
      {/* 1. TOP NAVIGATION HEADER (Image 1) */}
      <header className="w-full sticky top-0 z-40 bg-[#F7F4EC]/90 backdrop-blur-md border-b border-black/[0.06] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center justify-between">
          
          {/* Logo Brand */}
          <button
            type="button"
            onClick={() => setActiveTab("home")}
            className="cursor-pointer flex items-center hover:opacity-90 transition-opacity"
            aria-label="FRS UTH Campus Radio"
          >
            <UthLogo size="md" />
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 lg:gap-9 text-sm font-semibold">
            <button
              onClick={() => setActiveTab("home")}
              className={`cursor-pointer transition-colors ${
                activeTab === "home" ? "text-[#DF3B2B] font-bold" : "text-[#6B6560] hover:text-[#1C1917]"
              }`}
            >
              {currentT.navHome}
            </button>
            <button
              onClick={() => setActiveTab("program")}
              className={`cursor-pointer transition-colors ${
                activeTab === "program" ? "text-[#DF3B2B] font-bold" : "text-[#6B6560] hover:text-[#1C1917]"
              }`}
            >
              {currentT.navProgram}
            </button>
            <button
              onClick={() => setActiveTab("events")}
              className={`cursor-pointer transition-colors ${
                activeTab === "events" ? "text-[#DF3B2B] font-bold" : "text-[#6B6560] hover:text-[#1C1917]"
              }`}
            >
              {currentT.navEvents}
            </button>
            <button
              onClick={() => setActiveTab("archive")}
              className={`cursor-pointer transition-colors ${
                activeTab === "archive" ? "text-[#DF3B2B] font-bold" : "text-[#6B6560] hover:text-[#1C1917]"
              }`}
            >
              {currentT.navArchive}
            </button>
          </nav>

          {/* Right Actions (Language Pill & Listen Button) */}
          <div className="flex items-center gap-3">
            {/* Language Switch Pill */}
            <div className="flex items-center bg-[#EFECE3] p-1 rounded-full text-xs font-bold text-[#6B6560]">
              <button
                onClick={() => setIsGreek(true)}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  isGreek ? "bg-white text-[#1C1917] shadow-xs" : "hover:text-[#1C1917]"
                }`}
              >
                GR
              </button>
              <button
                onClick={() => setIsGreek(false)}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  !isGreek ? "bg-white text-[#1C1917] shadow-xs" : "hover:text-[#1C1917]"
                }`}
              >
                EN
              </button>
            </div>

            {/* Primary Red Listen Button */}
            <button
              onClick={() => {
                setStationPlaying(!stationPlaying);
                const playerEl = document.getElementById("floating-player-section");
                if (playerEl) {
                  playerEl.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }}
              className="flex items-center gap-2 bg-[#DF3B2B] hover:bg-[#C62F20] text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-md shadow-[#DF3B2B]/25 hover:shadow-lg hover:shadow-[#DF3B2B]/35 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <span className={`w-2 h-2 rounded-full bg-white ${stationPlaying ? "animate-ping" : ""}`} />
              <span>{stationPlaying ? currentT.playingBtn : currentT.listenBtn}</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col gap-16 sm:gap-24">
        <AnimatePresence mode="wait">
          
          {/* =========================================================================
              HOME VIEW (Matching Images 1, 2, 3)
             ========================================================================= */}
          {activeTab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-16 sm:gap-24"
            >
              
              {/* SECTION 1: HERO SECTION (Image 1) */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                
                {/* Left Column: Hero Copy & CTAs */}
                <div className="lg:col-span-7 flex flex-col items-start text-left">
                  
                  {/* Top Pill Tag */}
                  <div className="inline-flex items-center gap-2 bg-[#FEECEB] border border-[#F7C8C4] px-3.5 py-1.5 rounded-full text-xs font-bold text-[#DF3B2B] mb-6 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-[#DF3B2B] animate-pulse" />
                    <span>{currentT.heroTag}</span>
                  </div>

                  {/* Editorial Headline */}
                  <h1 className="font-editorial text-4xl sm:text-5xl lg:text-[62px] leading-[1.08] font-medium tracking-tight text-[#1C1917]">
                    {currentT.heroTitle1} <br />
                    <span className="italic font-bold text-[#DF3B2B]">{currentT.heroTitle2}</span>
                  </h1>

                  {/* Subtitle */}
                  <p className="mt-6 text-base sm:text-lg text-[#6B6560] leading-relaxed max-w-xl font-normal">
                    {currentT.heroSub}
                  </p>

                  {/* Hero Action Buttons */}
                  <div className="mt-8 flex flex-wrap items-center gap-4 w-full sm:w-auto">
                    {/* Primary Button */}
                    <button
                      onClick={() => setStationPlaying(!stationPlaying)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2.5 bg-[#DF3B2B] hover:bg-[#C62F20] text-white px-7 py-3.5 rounded-full font-bold text-sm shadow-md shadow-[#DF3B2B]/25 hover:shadow-lg hover:shadow-[#DF3B2B]/35 transition-all cursor-pointer active:scale-95"
                    >
                      {stationPlaying ? (
                        <Pause className="w-4 h-4 fill-white text-white" />
                      ) : (
                        <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                      )}
                      <span>{currentT.listenLive}</span>
                    </button>

                    {/* Live Chat Button */}
                    <button
                      onClick={() => setChatOpen(true)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2.5 bg-white hover:bg-[#FAF8F4] text-[#1C1917] border border-black/10 px-6 py-3.5 rounded-full font-bold text-sm shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95"
                    >
                      <MessageSquare className="w-4 h-4 text-[#DF3B2B]" />
                      <span>{currentT.liveChat}</span>
                    </button>
                  </div>

                  {/* Metrics / Stats Row */}
                  <div className="mt-12 pt-8 border-t border-black/[0.08] grid grid-cols-3 gap-6 sm:gap-10 w-full max-w-lg">
                    <div>
                      <div className="font-black text-2xl sm:text-3xl text-[#1C1917] tracking-tight">
                        {currentT.stat1}
                      </div>
                      <div className="text-xs font-semibold text-[#6B6560] mt-1">
                        {currentT.stat1Sub}
                      </div>
                    </div>

                    <div>
                      <div className="font-black text-2xl sm:text-3xl text-[#1C1917] tracking-tight">
                        {currentT.stat2}
                      </div>
                      <div className="text-xs font-semibold text-[#6B6560] mt-1">
                        {currentT.stat2Sub}
                      </div>
                    </div>

                    <div>
                      <div className="font-black text-2xl sm:text-3xl text-[#1C1917] tracking-tight">
                        {currentT.stat3}
                      </div>
                      <div className="text-xs font-semibold text-[#6B6560] mt-1">
                        {currentT.stat3Sub}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Hero Studio Visual Card */}
                <div className="lg:col-span-5 relative">
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-black/10 aspect-square sm:aspect-[4/5] bg-stone-900 group">
                    <img
                      src="/hero-studio.jpg"
                      alt="FRS UTH Radio Broadcast Studio"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    
                    {/* Floating Info Overlay Inside Image Card */}
                    <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-black/10 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <div className="flex items-center gap-1.5 text-[#DF3B2B]">
                          <span className="w-2 h-2 rounded-full bg-[#DF3B2B] animate-pulse" />
                          <span>{currentT.nowOnAir}</span>
                        </div>
                        <span className="text-[#6B6560] font-mono">{currentT.studioLocation}</span>
                      </div>
                      
                      <h4 className="font-bold text-sm sm:text-base text-[#1C1917] truncate leading-snug">
                        {currentLiveShow ? currentLiveShow.title : currentT.autoStreamTitle}
                      </h4>
                      
                      <p className="text-xs text-[#6B6560] truncate font-medium">
                        {currentLiveShow ? `${currentLiveShow.host} • ${currentLiveShow.time}` : currentT.autoStreamSub}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 2: FLOATING PLAYER & TODAY'S SCHEDULE (Image 2) */}
              <section id="floating-player-section" className="flex flex-col gap-10">
                
                {/* Floating Player Component */}
                <MainPlayer
                  isGreek={isGreek}
                  stationPlaying={stationPlaying}
                  setStationPlaying={setStationPlaying}
                  activeTrackId={activeTrackId}
                  currentLiveShow={currentLiveShow}
                  onOpenChat={() => setChatOpen(true)}
                />

                {/* Today's Schedule Section */}
                <div className="flex flex-col gap-6 mt-4">
                  {/* Section Title Header */}
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-black/[0.06] pb-4">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#DF3B2B] tracking-wider uppercase mb-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{currentT.upcomingShowsTag}</span>
                      </div>
                      <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#1C1917]">
                        {currentT.todaysScheduleTitle}
                      </h2>
                    </div>

                    <button
                      onClick={() => setActiveTab("program")}
                      className="text-xs sm:text-sm font-bold text-[#DF3B2B] hover:text-[#C62F20] flex items-center gap-1 cursor-pointer transition-colors self-start sm:self-auto"
                    >
                      <span>{currentT.fullWeekLink}</span>
                    </button>
                  </div>

                  {/* 3 Schedule Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    
                    {/* Card 1: Currently Live / Automated Stream */}
                    <div 
                      onClick={() => currentLiveShow && handleOpenShowDescription(currentLiveShow)}
                      className={`warm-card rounded-2xl p-5 flex flex-col justify-between min-h-[175px] relative overflow-hidden cursor-pointer ${
                        currentLiveShow ? "border-l-4 border-l-[#DF3B2B]" : "border-t-2 border-t-[#DF3B2B]/40"
                      }`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-mono font-bold text-[#6B6560]">
                            {currentLiveShow ? currentLiveShow.time : "Non-Stop Stream"}
                          </span>
                          <span className="bg-[#FEECEB] text-[#DF3B2B] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {currentLiveShow ? (isGreek ? "ΖΩΝΤΑΝΑ ΤΩΡΑ" : "LIVE NOW") : (isGreek ? "ΤΩΡΑ • ΑΥΤΟΜΑΤΗ ΡΟΗ" : "NOW • AUTO STREAM")}
                          </span>
                        </div>

                        <h3 className="font-bold text-base text-[#1C1917] leading-snug">
                          {currentLiveShow ? currentLiveShow.title : currentT.noLiveShow}
                        </h3>

                        <p className="text-xs text-[#6B6560] mt-2 line-clamp-2 leading-relaxed">
                          {currentLiveShow ? `Με παραγωγό ${currentLiveShow.host}` : currentT.autoStreamDesc}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-black/[0.05] flex items-center justify-between text-[11px] text-[#6B6560] font-semibold">
                        <span>Studio Deck A</span>
                        <span className="w-2 h-2 rounded-full bg-[#DF3B2B]/60" />
                      </div>
                    </div>

                    {/* Card 2: Next Show */}
                    <div 
                      onClick={() => nextShow && handleOpenShowDescription(nextShow)}
                      className="warm-card rounded-2xl p-5 flex flex-col justify-between min-h-[175px] cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-mono font-bold text-[#6B6560]">
                            {nextShow ? (nextShow.timeLabel || nextShow.time) : "11:00 - 13:00"}
                          </span>
                          <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {isGreek ? "ΕΠΟΜΕΝΟ" : "NEXT"}
                          </span>
                        </div>

                        <h3 className="font-bold text-base text-[#1C1917] leading-snug">
                          {nextShow ? nextShow.title : "Indie Hour"}
                        </h3>

                        <span className="text-xs font-bold text-[#DF3B2B] mt-0.5">
                          {nextShow ? nextShow.host : "Sarah V."}
                        </span>

                        <p className="text-xs text-[#6B6560] mt-2 line-clamp-2 leading-relaxed">
                          {isGreek 
                            ? "Indie rock anthems, shoegaze ανακαλύψεις και συνεντεύξεις από την τοπική μουσική σκηνή."
                            : "Indie rock anthems, shoegaze discoveries and local music scene features."}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-black/[0.05] flex items-center justify-between text-[11px] text-[#6B6560] font-semibold">
                        <span>{isGreek ? "Εκπομπή Λόγου & Μουσικής" : "Music & Talk Show"}</span>
                        <span className="text-[#6B6560] font-mono">{isGreek ? "Σε 2 ώρες" : "In 2 hours"}</span>
                      </div>
                    </div>

                    {/* Card 3: Evening / Later Show */}
                    <div 
                      onClick={() => laterShow && handleOpenShowDescription(laterShow)}
                      className="warm-card rounded-2xl p-5 flex flex-col justify-between min-h-[175px] cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-mono font-bold text-[#6B6560]">
                            {laterShow ? (laterShow.timeLabel || laterShow.time) : "16:00 - 18:00"}
                          </span>
                          <span className="bg-stone-100 text-[#6B6560] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {isGreek ? "ΑΠΟΓΕΥΜΑ" : "EVENING"}
                          </span>
                        </div>

                        <h3 className="font-bold text-base text-[#1C1917] leading-snug">
                          {laterShow ? laterShow.title : "Rock Anthems"}
                        </h3>

                        <span className="text-xs font-bold text-[#DF3B2B] mt-0.5">
                          {laterShow ? laterShow.host : "DJ George"}
                        </span>

                        <p className="text-xs text-[#6B6560] mt-2 line-clamp-2 leading-relaxed">
                          {isGreek 
                            ? "Classic rock, grunge 90s riffs και progressive retrospectives σε ένα δυνατό δίωρο mix."
                            : "Classic rock, 90s grunge riffs and progressive retrospectives in a powerhouse 2-hour set."}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-black/[0.05] flex items-center justify-between text-[11px] text-[#6B6560] font-semibold">
                        <span>{isGreek ? "Heavy Guitar Session" : "Heavy Guitar Session"}</span>
                        <span className="text-[#6B6560] font-mono">{isGreek ? "Σε 7 ώρες" : "In 7 hours"}</span>
                      </div>
                    </div>

                  </div>
                </div>
              </section>

              {/* SECTION 3: EVENTS & OPEN CALL (Image 3) */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                
                {/* Left Column: Station Events */}
                <div className="lg:col-span-6 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#DF3B2B] tracking-wider uppercase mb-1">
                      {currentT.eventsTag}
                    </div>
                    <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#1C1917]">
                      {currentT.eventsTitle}
                    </h2>
                    <p className="mt-3 text-sm text-[#6B6560] leading-relaxed max-w-md">
                      {currentT.eventsDesc}
                    </p>
                  </div>

                  {/* Events List Cards */}
                  <div className="mt-6 flex flex-col gap-3.5">
                    {/* Event 1 */}
                    <div className="warm-card rounded-2xl p-4 flex items-center gap-4 cursor-pointer">
                      <div className="w-14 h-14 rounded-2xl bg-[#FEECEB] text-[#DF3B2B] flex flex-col items-center justify-center shrink-0 border border-[#F7C8C4]/60">
                        <span className="font-black text-lg leading-none">18</span>
                        <span className="text-[10px] font-extrabold uppercase mt-0.5 tracking-wider">ΜΑΙ</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h4 className="font-bold text-sm sm:text-base text-[#1C1917] truncate">
                          Campus Spring Festival 2026
                        </h4>
                        <p className="text-xs text-[#6B6560] truncate mt-0.5">
                          Live bands & outdoor dj stage στο Πεδίον του Άρεως
                        </p>
                      </div>
                    </div>

                    {/* Event 2 */}
                    <div className="warm-card rounded-2xl p-4 flex items-center gap-4 cursor-pointer">
                      <div className="w-14 h-14 rounded-2xl bg-[#FEECEB] text-[#DF3B2B] flex flex-col items-center justify-center shrink-0 border border-[#F7C8C4]/60">
                        <span className="font-black text-lg leading-none">24</span>
                        <span className="text-[10px] font-extrabold uppercase mt-0.5 tracking-wider">ΜΑΙ</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h4 className="font-bold text-sm sm:text-base text-[#1C1917] truncate">
                          Workshop: Podcast & Audio Production
                        </h4>
                        <p className="text-xs text-[#6B6560] truncate mt-0.5">
                          Εισαγωγή στη φωνητική τοποθέτηση και μίξη ήχου
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Open Call Feature Card */}
                <div className="lg:col-span-6">
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-black/10 min-h-[300px] h-full flex flex-col justify-end p-6 sm:p-8 group">
                    <img
                      src="/concert-party.jpg"
                      alt="Student DJ concert party"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />

                    <div className="relative z-10 flex flex-col items-start text-left">
                      <span className="bg-[#DF3B2B] text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider mb-3">
                        {currentT.openCallBadge}
                      </span>
                      
                      <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-white leading-tight">
                        {currentT.openCallTitle}
                      </h3>

                      <p className="text-xs sm:text-sm text-stone-300 mt-2 max-w-md leading-relaxed">
                        {currentT.openCallSub}
                      </p>

                      <button
                        onClick={() => setIsOpenCallModalOpen(true)}
                        className="mt-5 bg-white hover:bg-stone-100 text-[#1C1917] px-6 py-2.5 rounded-full font-bold text-xs shadow-lg transition-all cursor-pointer active:scale-95"
                      >
                        {currentT.applyNow}
                      </button>
                    </div>
                  </div>
                </div>

              </section>

            </motion.div>
          )}

          {/* =========================================================================
              WEEKLY PROGRAM VIEW
             ========================================================================= */}
          {activeTab === "program" && (
            <motion.div
              key="program"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-8"
            >
              {/* Program Header */}
              <div className="text-center max-w-2xl mx-auto flex flex-col items-center gap-3">
                <span className="text-xs font-bold text-[#DF3B2B] tracking-wider uppercase">
                  {isGreek ? "ΡΟΗ ΕΚΠΟΜΠΩΝ" : "SHOW SCHEDULE"}
                </span>
                <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1917]">
                  {isGreek ? "Εβδομαδιαίο Πρόγραμμα" : "Weekly Program"}
                </h1>
                <p className="text-sm text-[#6B6560] leading-relaxed">
                  {isGreek 
                    ? "Συντονιστείτε στον ηχητικό παλμό της φοιτητικής μας ομάδας. 40+ ραδιοφωνικοί παραγωγοί, εκλεκτικές μουσικές επιλογές και live panels όλη την εβδομάδα."
                    : "Tune in to the sonic pulse of our student broadcast team. 40+ radio producers, curated rotations, and live panels all week long."}
                </p>
              </div>

              {/* Mobile / Tablet Day Selector */}
              <div className="block lg:hidden w-full">
                <div className="flex overflow-x-auto gap-2 pb-3 no-scrollbar snap-x">
                  {(isGreek ? WEEKLY_SCHEDULE_GR : WEEKLY_SCHEDULE_EN).map((dayProg, idx) => (
                    <button
                      key={dayProg.day}
                      onClick={() => setSelectedMobileDay(idx)}
                      className={`snap-start shrink-0 px-5 py-2.5 rounded-full font-bold text-xs transition-all cursor-pointer ${
                        selectedMobileDay === idx
                          ? "bg-[#DF3B2B] text-white shadow-md shadow-[#DF3B2B]/20"
                          : "bg-white text-[#1C1917] border border-black/10"
                      }`}
                    >
                      {dayProg.day}
                    </button>
                  ))}
                </div>

                {/* Mobile Shows Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {(isGreek ? WEEKLY_SCHEDULE_GR : WEEKLY_SCHEDULE_EN)[selectedMobileDay].shows.map((show) => (
                    <div
                      key={show.id}
                      onClick={() => handleOpenShowDescription(show)}
                      className="warm-card rounded-2xl p-5 flex flex-col justify-between gap-4 cursor-pointer group"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono font-bold text-[#6B6560] bg-[#FAF8F4] px-2.5 py-1 rounded-lg border border-black/5">
                          {show.time}
                        </span>
                        {currentLiveShow?.id === show.id && (
                          <span className="bg-[#FEECEB] text-[#DF3B2B] text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                            LIVE
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-base text-[#1C1917] group-hover:text-[#DF3B2B] transition-colors">
                          {show.title}
                        </h4>
                        <p className="text-xs text-[#6B6560] mt-1 font-semibold">
                          {show.host}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-black/[0.05]">
                        {show.tags.map(tag => (
                          <span key={tag} className="text-[10px] bg-[#FAF8F4] text-[#6B6560] px-2 py-0.5 rounded-md font-semibold border border-black/[0.05]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop 7-Day Grid */}
              <div className="hidden lg:grid lg:grid-cols-7 gap-3 xl:gap-4 items-start w-full">
                {(isGreek ? WEEKLY_SCHEDULE_GR : WEEKLY_SCHEDULE_EN).map((dayProg) => (
                  <div key={dayProg.day} className="flex flex-col gap-3">
                    <div className="bg-white rounded-xl p-3 border border-black/10 text-center shadow-xs">
                      <span className="font-black text-sm text-[#1C1917]">{dayProg.day}</span>
                      <span className="block text-[10px] text-[#6B6560] font-semibold">{dayProg.fullName}</span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {dayProg.shows.map((show) => {
                        const isLive = currentLiveShow?.id === show.id;
                        return (
                          <div
                            key={show.id}
                            onClick={() => handleOpenShowDescription(show)}
                            className={`warm-card rounded-xl p-3 flex flex-col gap-2 cursor-pointer group ${
                              isLive ? "border-l-4 border-l-[#DF3B2B] bg-[#FEECEB]/30" : ""
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-mono font-bold text-[#6B6560]">
                                {show.time}
                              </span>
                              {isLive && (
                                <span className="w-2 h-2 rounded-full bg-[#DF3B2B] animate-pulse" />
                              )}
                            </div>

                            <div>
                              <h4 className="font-bold text-xs text-[#1C1917] group-hover:text-[#DF3B2B] transition-colors leading-tight">
                                {show.title}
                              </h4>
                              <p className="text-[10px] text-[#6B6560] font-medium mt-0.5 truncate">
                                {show.host}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              EVENTS VIEW
             ========================================================================= */}
          {activeTab === "events" && (
            <motion.div
              key="events"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-10 max-w-4xl mx-auto w-full"
            >
              <div className="text-center max-w-2xl mx-auto flex flex-col items-center gap-3">
                <span className="text-xs font-bold text-[#DF3B2B] tracking-wider uppercase">
                  {currentT.eventsTag}
                </span>
                <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1917]">
                  {currentT.eventsTitle}
                </h1>
                <p className="text-sm text-[#6B6560] leading-relaxed">
                  {currentT.eventsDesc}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Event 1 */}
                <div className="warm-card rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-[#FEECEB] text-[#DF3B2B] flex flex-col items-center justify-center shrink-0 border border-[#F7C8C4]">
                    <span className="font-black text-2xl leading-none">18</span>
                    <span className="text-xs font-extrabold uppercase mt-1">ΜΑΙ</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-[#DF3B2B] uppercase tracking-wider">Festival</span>
                    <h3 className="font-bold text-xl text-[#1C1917] mt-0.5">Campus Spring Festival 2026</h3>
                    <p className="text-xs sm:text-sm text-[#6B6560] mt-1.5 leading-relaxed">
                      Το μεγαλύτερο φοιτητικό φεστιβάλ του Βόλου με live acts, indie & techno stages στο Πεδίον του Άρεως. Είσοδος ελεύθερη για όλους.
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab("contact")}
                    className="px-5 py-2.5 rounded-full bg-[#1C1917] text-white font-bold text-xs hover:bg-black transition-colors shrink-0 cursor-pointer"
                  >
                    {isGreek ? "Πληροφορίες" : "Details"}
                  </button>
                </div>

                {/* Event 2 */}
                <div className="warm-card rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-[#FEECEB] text-[#DF3B2B] flex flex-col items-center justify-center shrink-0 border border-[#F7C8C4]">
                    <span className="font-black text-2xl leading-none">24</span>
                    <span className="text-xs font-extrabold uppercase mt-1">ΜΑΙ</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-[#DF3B2B] uppercase tracking-wider">Workshop</span>
                    <h3 className="font-bold text-xl text-[#1C1917] mt-0.5">Workshop: Podcast & Audio Production</h3>
                    <p className="text-xs sm:text-sm text-[#6B6560] mt-1.5 leading-relaxed">
                      Hands-on εκπαίδευση στο broadcast studio του σταθμού. Μάθετε μίξη, mastering, φωνητική τοποθέτηση και live stream management.
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab("contact")}
                    className="px-5 py-2.5 rounded-full bg-[#1C1917] text-white font-bold text-xs hover:bg-black transition-colors shrink-0 cursor-pointer"
                  >
                    {isGreek ? "Συμμετοχή" : "Register"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              MIXCLOUD ARCHIVE VIEW
             ========================================================================= */}
          {activeTab === "archive" && (
            <motion.div
              key="archive"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-8 max-w-5xl mx-auto w-full"
            >
              <div className="text-center max-w-2xl mx-auto flex flex-col items-center gap-3">
                <span className="text-xs font-bold text-[#DF3B2B] tracking-wider uppercase">
                  {isGreek ? "ΑΡΧΕΙΟ ΕΚΠΟΜΠΩΝ" : "AUDIO VAULT"}
                </span>
                <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1917]">
                  {isGreek ? "Αρχείο Mixcloud" : "Mixcloud Archive"}
                </h1>
                <p className="text-sm text-[#6B6560] leading-relaxed">
                  {isGreek
                    ? "Βουτήξτε στο αρχείο μας. Παλιές εκπομπές, θρυλικά sets και φοιτητική ραδιοφωνική ιστορία αποθηκευμένα στο επίσημο κανάλι μας."
                    : "Dive into our vault. Past broadcasts, legendary DJ sets, and student radio history preserved on our Mixcloud channel."}
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-md mx-auto w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6560]" />
                <input
                  type="text"
                  value={archiveSearch}
                  onChange={(e) => setArchiveSearch(e.target.value)}
                  placeholder={isGreek ? "Αναζήτηση εκπομπών, DJs, ειδών..." : "Search shows, DJs, genres..."}
                  className="field pl-11 pr-4 py-3 rounded-full text-sm"
                />
              </div>

              {/* Archive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArchive.map((item) => (
                  <div key={item.id} className="warm-card rounded-3xl overflow-hidden flex flex-col justify-between group">
                    <div className="relative aspect-video overflow-hidden bg-stone-900">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                        {item.date}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-base text-[#1C1917] group-hover:text-[#DF3B2B] transition-colors leading-snug">
                          {item.title}
                        </h4>
                        <p className="text-xs text-[#6B6560] mt-2 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-black/[0.05] flex items-center justify-between">
                        <div className="flex gap-1.5">
                          {item.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[10px] text-[#6B6560] font-semibold">
                              {tag}
                            </span>
                          ))}
                        </div>

                        <a
                          href={item.mixcloudUrl || "https://www.mixcloud.com/frs-volou/"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-[#DF3B2B] hover:text-[#C62F20] flex items-center gap-1"
                        >
                          <span>Mixcloud</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {!loadedMore && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={archiveLoading}
                    className="px-6 py-3 rounded-full bg-white border border-black/10 text-[#1C1917] font-bold text-xs hover:bg-[#FAF8F4] transition-all cursor-pointer shadow-xs"
                  >
                    {archiveLoading ? (isGreek ? "Φόρτωση..." : "Loading...") : (isGreek ? "Φόρτωση Περισσότερων" : "Load More Archives")}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* =========================================================================
              CONTACT VIEW
             ========================================================================= */}
          {activeTab === "contact" && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-10 max-w-4xl mx-auto w-full"
            >
              <div className="text-center max-w-2xl mx-auto flex flex-col items-center gap-3">
                <span className="text-xs font-bold text-[#DF3B2B] tracking-wider uppercase">
                  {isGreek ? "ΕΠΙΚΟΙΝΩΝΙΑ" : "GET IN TOUCH"}
                </span>
                <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1917]">
                  {isGreek ? "Επικοινωνήστε Μαζί Μας" : "Contact Us"}
                </h1>
                <p className="text-sm text-[#6B6560] leading-relaxed">
                  {isGreek 
                    ? "Έχετε ερώτηση, μουσική πρόταση ή θέλετε να ενταχθείτε στην ραδιοφωνική ομάδα του FRS UTH; Στείλτε μας μήνυμα!"
                    : "Have a question, music pitch, or want to join the FRS UTH radio crew? Send us a message!"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Contact Info Cards */}
                <div className="md:col-span-5 flex flex-col gap-4">
                  <div className="warm-card rounded-2xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#FEECEB] text-[#DF3B2B] flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#1C1917]">{isGreek ? "Έδρα" : "Location"}</h4>
                      <p className="text-xs text-[#6B6560] mt-1 leading-relaxed">
                        Πανεπιστήμιο Θεσσαλίας<br />Βόλος, Ελλάδα
                      </p>
                    </div>
                  </div>

                  <div className="warm-card rounded-2xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#FEECEB] text-[#DF3B2B] flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#1C1917]">Email</h4>
                      <p className="text-xs text-[#6B6560] mt-1">
                        <a href="mailto:info@frsvolou.gr" className="hover:text-[#DF3B2B] transition-colors">info@frsvolou.gr</a>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Form */}
                <div className="md:col-span-7 warm-card rounded-3xl p-6 sm:p-8">
                  {contactSubmitted ? (
                    <div className="flex flex-col items-center justify-center text-center py-8 gap-3">
                      <CheckCircle2 className="w-12 h-12 text-[#DF3B2B]" />
                      <h3 className="font-bold text-xl text-[#1C1917]">
                        {isGreek ? "Το μήνυμα στάλθηκε!" : "Message Sent!"}
                      </h3>
                      <p className="text-xs text-[#6B6560] max-w-sm">
                        {isGreek
                          ? "Ευχαριστούμε για την επικοινωνία. Η ομάδα του FRS UTH θα σας απαντήσει σύντομα!"
                          : "Thank you for reaching out. The FRS UTH team will get back to you soon!"}
                      </p>
                      <button
                        onClick={() => {
                          setContactSubmitted(false);
                          setContactForm({ name: "", email: "", category: "join", message: "" });
                        }}
                        className="mt-4 px-6 py-2.5 rounded-full bg-[#DF3B2B] text-white font-bold text-xs hover:bg-[#C62F20] transition-colors cursor-pointer"
                      >
                        {isGreek ? "Νέο Μήνυμα" : "New Message"}
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
                          console.error("Error saving message:", err);
                        }
                        
                        const subject = encodeURIComponent(`[FRS UTH Contact] ${contactForm.category.toUpperCase()} - ${contactForm.name}`);
                        const body = encodeURIComponent(`Name: ${contactForm.name}\nEmail: ${contactForm.email}\nCategory: ${contactForm.category}\n\nMessage:\n${contactForm.message}`);
                        window.location.href = `mailto:info@frsvolou.gr?subject=${subject}&body=${body}`;

                        setContactLoading(false);
                        setContactSubmitted(true);
                      }}
                      className="flex flex-col gap-4"
                    >
                      <div>
                        <label className="block text-xs font-bold text-[#1C1917] mb-1">
                          {isGreek ? "Όνομα" : "Name"}
                        </label>
                        <input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          placeholder={isGreek ? "Το όνομά σας" : "Your name"}
                          className="field"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#1C1917] mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          placeholder="your.email@example.com"
                          className="field"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#1C1917] mb-1">
                          {isGreek ? "Κατηγορία" : "Category"}
                        </label>
                        <select
                          value={contactForm.category}
                          onChange={(e) => setContactForm({ ...contactForm, category: e.target.value })}
                          className="field cursor-pointer"
                        >
                          <option value="join">{isGreek ? "Συμμετοχή στο Ραδιόφωνο (Παραγωγός)" : "Join the Radio Crew (Host/DJ)"}</option>
                          <option value="general">{isGreek ? "Γενική Ερώτηση" : "General Query"}</option>
                          <option value="technical">{isGreek ? "Τεχνικό Θέμα" : "Technical Support"}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#1C1917] mb-1">
                          {isGreek ? "Μήνυμα" : "Message"}
                        </label>
                        <textarea
                          required
                          rows={4}
                          value={contactForm.message}
                          onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                          placeholder={isGreek ? "Γράψτε το μήνυμά σας..." : "Write your message..."}
                          className="field resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={contactLoading}
                        className="w-full bg-[#DF3B2B] hover:bg-[#C62F20] text-white font-bold py-3 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#DF3B2B]/20"
                      >
                        {contactLoading ? (
                          <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>{isGreek ? "Αποστολή Μηνύματος" : "Send Message"}</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* 4. MODERN DARK FOOTER (Image 4) */}
      <footer className="w-full bg-[#111215] text-stone-300 pt-16 pb-12 mt-auto border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12">
          
          {/* Main 3-Column Footer Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14">
            
            {/* Column 1: Logo & Mission */}
            <div className="md:col-span-5 flex flex-col items-start gap-4">
              <UthLogo isDark={true} size="md" />
              <p className="text-xs sm:text-sm text-stone-400 max-w-sm leading-relaxed mt-1">
                {currentT.footerDesc}
              </p>
              <div className="text-[11px] text-stone-500 font-mono tracking-wide">
                {currentT.cities}
              </div>
            </div>

            {/* Column 2: Navigation Links */}
            <div className="md:col-span-3 flex flex-col gap-3">
              <h4 className="text-xs font-black tracking-widest text-white uppercase font-mono">
                {currentT.navTitle}
              </h4>
              <ul className="flex flex-col gap-2.5 text-xs text-stone-400 font-medium">
                <li>
                  <button onClick={() => setActiveTab("home")} className="hover:text-white transition-colors cursor-pointer">
                    {currentT.navHome}
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab("program")} className="hover:text-white transition-colors cursor-pointer">
                    {currentT.navProgram}
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab("events")} className="hover:text-white transition-colors cursor-pointer">
                    {currentT.navEvents}
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab("archive")} className="hover:text-white transition-colors cursor-pointer">
                    {currentT.navArchive}
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Connect & Mixcloud Button */}
            <div className="md:col-span-4 flex flex-col gap-3">
              <h4 className="text-xs font-black tracking-widest text-white uppercase font-mono">
                {currentT.connectTitle}
              </h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                {currentT.connectText}
              </p>
              <a
                href="https://www.mixcloud.com/frs-volou/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-white px-4 py-2.5 rounded-full font-bold text-xs transition-all w-fit shadow-md group"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#DF3B2B] group-hover:scale-110 transition-transform" />
                <span>{currentT.mixcloudBtn}</span>
              </a>
            </div>

          </div>

          {/* Bottom Copyright & Legal Links */}
          <div className="pt-8 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-500">
            <div>
              {currentT.copyright}
            </div>
            <div className="flex items-center gap-4">
              <a href="#terms" onClick={(e) => { e.preventDefault(); alert("FRS UTH is an open student radio run under the University of Thessaly."); }} className="hover:text-stone-400 transition-colors">
                {currentT.terms}
              </a>
              <a href="#privacy" onClick={(e) => { e.preventDefault(); alert("FRS UTH preserves privacy and does not track personal identifying data."); }} className="hover:text-stone-400 transition-colors">
                {currentT.privacy}
              </a>
            </div>
          </div>

        </div>
      </footer>

      {/* SHOW DESCRIPTION MODAL OVERLAY */}
      <AnimatePresence>
        {selectedShowId && (() => {
          const selectedShow = getShowDetails(selectedShowId);
          if (!selectedShow) return null;
          return (
            <div 
              onClick={() => setSelectedShowId(null)}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-black/10 relative my-auto"
              >
                <button
                  onClick={() => setSelectedShowId(null)}
                  className="absolute top-4 right-4 text-[#6B6560] hover:text-[#1C1917] p-1.5 rounded-full hover:bg-[#FAF8F4] cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col gap-4">
                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-stone-900 border border-black/10">
                    <img
                      src={selectedShow.image || "/hero-studio.jpg"}
                      alt={selectedShow.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {selectedShow.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-[#FEECEB] text-[#DF3B2B] px-2.5 py-0.5 rounded-full font-bold">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C1917]">
                      {selectedShow.title}
                    </h2>
                    <p className="text-xs font-bold text-[#DF3B2B] mt-0.5">
                      {isGreek ? "Παραγωγός" : "Hosted by"}: {selectedShow.host}
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-[#6B6560] leading-relaxed">
                    {selectedShow.description}
                  </p>

                  <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between gap-3">
                    <button
                      onClick={() => {
                        handleTuneChannel(selectedShow.id);
                        setSelectedShowId(null);
                      }}
                      className="flex-1 bg-[#DF3B2B] hover:bg-[#C62F20] text-white py-3 px-5 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#DF3B2B]/20"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>{isGreek ? "Συντονισμός & Ακρόαση" : "Tune & Listen"}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* OPEN CALL 2026 APPLICATION MODAL */}
      <AnimatePresence>
        {isOpenCallModalOpen && (
          <div 
            onClick={() => setIsOpenCallModalOpen(false)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-black/10 relative my-auto"
            >
              <button
                onClick={() => setIsOpenCallModalOpen(false)}
                className="absolute top-4 right-4 text-[#6B6560] hover:text-[#1C1917] p-1.5 rounded-full hover:bg-[#FAF8F4] cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {openCallSubmitted ? (
                <div className="flex flex-col items-center text-center py-6 gap-3">
                  <CheckCircle2 className="w-14 h-14 text-[#DF3B2B]" />
                  <h3 className="font-bold text-xl text-[#1C1917]">
                    {isGreek ? "Η αίτηση καταχωρήθηκε!" : "Application Submitted!"}
                  </h3>
                  <p className="text-xs text-[#6B6560] max-w-sm">
                    {isGreek 
                      ? "Σας ευχαριστούμε για το ενδιαφέρον. Η ομάδα προγράμματος του FRS UTH θα επικοινωνήσει μαζί σας για demo session!"
                      : "Thank you for applying. The FRS UTH program board will reach out to schedule a demo session!"}
                  </p>
                  <button
                    onClick={() => {
                      setOpenCallSubmitted(false);
                      setIsOpenCallModalOpen(false);
                    }}
                    className="mt-4 px-6 py-2.5 rounded-full bg-[#DF3B2B] text-white font-bold text-xs cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setOpenCallLoading(true);
                    try {
                      await addDoc(collection(db, "open_call_applications"), {
                        name: openCallForm.name,
                        email: openCallForm.email,
                        showConcept: openCallForm.showConcept,
                        musicGenres: openCallForm.musicGenres,
                        phone: openCallForm.phone,
                        createdAt: serverTimestamp()
                      });
                    } catch (err) {
                      console.error("Error saving open call application:", err);
                    }

                    const subject = encodeURIComponent(`[Open Call 2026 Application] - ${openCallForm.name}`);
                    const body = encodeURIComponent(`Name: ${openCallForm.name}\nEmail: ${openCallForm.email}\nPhone: ${openCallForm.phone}\nGenres: ${openCallForm.musicGenres}\n\nConcept:\n${openCallForm.showConcept}`);
                    window.location.href = `mailto:studio@frsvolou.gr?subject=${subject}&body=${body}`;

                    setOpenCallLoading(false);
                    setOpenCallSubmitted(true);
                  }}
                  className="flex flex-col gap-3.5"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-[#DF3B2B] uppercase">
                    <Sparkles className="w-4 h-4" />
                    <span>Open Call 2026</span>
                  </div>

                  <h3 className="font-editorial text-2xl font-bold text-[#1C1917]">
                    {isGreek ? "Αίτηση Νέου Ραδιοφωνικού Παραγωγού" : "Radio Producer Application"}
                  </h3>

                  <p className="text-xs text-[#6B6560]">
                    {isGreek 
                      ? "Συμπληρώστε τα στοιχεία σας και την ιδέα της εκπομπής σας για το επόμενο ακαδημαϊκό εξάμηνο."
                      : "Fill in your details and show concept for the upcoming academic semester."}
                  </p>

                  <div>
                    <label className="block text-xs font-bold text-[#1C1917] mb-1">
                      {isGreek ? "Ονοματεπώνυμο" : "Full Name"}
                    </label>
                    <input
                      type="text"
                      required
                      value={openCallForm.name}
                      onChange={(e) => setOpenCallForm({ ...openCallForm, name: e.target.value })}
                      placeholder={isGreek ? "π.χ. Αλέξανδρος Παπαδόπουλος" : "e.g. Alex Johnson"}
                      className="field"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#1C1917] mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={openCallForm.email}
                        onChange={(e) => setOpenCallForm({ ...openCallForm, email: e.target.value })}
                        placeholder="email@uth.gr"
                        className="field"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1C1917] mb-1">
                        {isGreek ? "Τηλέφωνο" : "Phone"}
                      </label>
                      <input
                        type="tel"
                        value={openCallForm.phone}
                        onChange={(e) => setOpenCallForm({ ...openCallForm, phone: e.target.value })}
                        placeholder="69xxxxxxxx"
                        className="field"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1C1917] mb-1">
                      {isGreek ? "Μουσικά Είδη / Θεματολογία" : "Music Genres / Topic"}
                    </label>
                    <input
                      type="text"
                      required
                      value={openCallForm.musicGenres}
                      onChange={(e) => setOpenCallForm({ ...openCallForm, musicGenres: e.target.value })}
                      placeholder="e.g. Indie Rock, Post-Punk, Electronic, Talks"
                      className="field"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1C1917] mb-1">
                      {isGreek ? "Περιγραφή & Ιδέα Εκπομπής" : "Show Concept & Pitch"}
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={openCallForm.showConcept}
                      onChange={(e) => setOpenCallForm({ ...openCallForm, showConcept: e.target.value })}
                      placeholder={isGreek ? "Περιγράψτε συνοπτικά την ιδέα σας..." : "Briefly describe your show concept..."}
                      className="field resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={openCallLoading}
                    className="w-full bg-[#DF3B2B] hover:bg-[#C62F20] text-white font-bold py-3 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#DF3B2B]/20 mt-2"
                  >
                    {openCallLoading ? (
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>{isGreek ? "Υποβολή Αίτησης" : "Submit Application"}</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LIVE CHAT DRAWER */}
      <LiveChat
        isGreek={isGreek}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        onActiveTrackTrigger={handleTuneChannel}
        currentLiveShow={currentLiveShow}
      />

    </div>
  );
}