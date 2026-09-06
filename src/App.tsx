/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
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
  Filter,
  Mic,
  Menu,
  Loader2,
  BarChart2,
  Instagram
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import UthLogo from "./components/UthLogo";
import MainPlayer from "./components/MainPlayer";
import LiveChat from "./components/LiveChat";
import ComingSoonOverlay from "./components/ComingSoonOverlay";
import { subscribeToActivePoll } from "./lib/pollService";
import { subscribeToSiteConfig, setComingSoonMode, isAdminAuthenticated, logoutAdmin, getCachedComingSoon } from "./lib/adminService";
import { 
  subscribeToCustomSchedule, 
  subscribeToCustomEvents, 
  saveOpenCallApplication,
  getCachedCustomSchedule,
  getCachedCustomEvents,
  sortShowsByTime
} from "./lib/contentService";
import { LivePollData, SiteConfig, DayProgram, StationEvent } from "./types";
import { 
  WEEKLY_SCHEDULE_GR, 
  WEEKLY_SCHEDULE_EN, 
  DEFAULT_EVENTS_GR,
  DEFAULT_EVENTS_EN,
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
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [activeTrackId, setActiveTrackId] = useState<string>("");
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);
  const [isOpenCallModalOpen, setIsOpenCallModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activePoll, setActivePoll] = useState<LivePollData | null>(null);

  // Subscribe to real-time active poll from RTDB (Firebase Spark free tier zero-cost)
  useEffect(() => {
    const unsubscribe = subscribeToActivePoll((poll) => {
      setActivePoll(poll);
    });
    return () => unsubscribe();
  }, []);

  // Custom schedule & events from RTDB with synchronous local cache (eliminates initial flash on refresh)
  const [customSchedule, setCustomSchedule] = useState<DayProgram[] | null>(() => getCachedCustomSchedule());
  const [customEvents, setCustomEvents] = useState<StationEvent[] | null>(() => getCachedCustomEvents());

  useEffect(() => {
    const unsubSchedule = subscribeToCustomSchedule((sched) => {
      setCustomSchedule(sched);
    });
    const unsubEvents = subscribeToCustomEvents((evts) => {
      setCustomEvents(evts);
    });
    return () => {
      unsubSchedule();
      unsubEvents();
    };
  }, []);

  const activeSchedule = useMemo(() => {
    const fallbackShows = isGreek ? SHOWS_DESCRIPTIONS_GR : SHOWS_DESCRIPTIONS_EN;
    const baseSchedule = (customSchedule && customSchedule.length > 0)
      ? customSchedule
      : (isGreek ? WEEKLY_SCHEDULE_GR : WEEKLY_SCHEDULE_EN);

    return baseSchedule.map(day => {
      const showsWithDescriptions = (day.shows || []).map(show => {
        if (show.description && show.description.trim()) {
          return show;
        }
        const found = fallbackShows.find(
          d => d.id === show.id || d.title.toLowerCase().trim() === show.title.toLowerCase().trim()
        );
        return {
          ...show,
          description: found?.description || show.description || ""
        };
      });

      return {
        ...day,
        shows: sortShowsByTime(showsWithDescriptions)
      };
    });
  }, [customSchedule, isGreek]);

  const activeEvents = useMemo(() => {
    if (customEvents !== null && Array.isArray(customEvents)) {
      return customEvents;
    }
    return isGreek ? DEFAULT_EVENTS_GR : DEFAULT_EVENTS_EN;
  }, [customEvents, isGreek]);

  // Site-Wide Config (Coming Soon) & Admin state (synchronous local cache eliminates any initial flash)
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => {
    const cached = getCachedComingSoon();
    return {
      // Default to true if not cached yet (guarantees zero flash of unlaunched site on first visit)
      isComingSoon: cached !== null ? cached : true
    };
  });
  const [isConfigReady, setIsConfigReady] = useState<boolean>(() => {
    return getCachedComingSoon() !== null || isAdminAuthenticated();
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(() => isAdminAuthenticated());

  // Real-time subscription to siteConfig in RTDB
  useEffect(() => {
    const unsubscribe = subscribeToSiteConfig((config) => {
      if (config) {
        setSiteConfig(config);
        setIsConfigReady(true);
        if (config.isComingSoon && !isAdminAuthenticated()) {
          // Pause radio playback and close chat if Coming Soon is turned on for non-admin
          setStationPlaying(false);
          setIsLoadingAudio(false);
          setChatOpen(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Safety fallback: ensure isConfigReady resolves even if network/RTDB delays
  useEffect(() => {
    if (!isConfigReady) {
      const timer = setTimeout(() => {
        setIsConfigReady(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isConfigReady]);

  // Active day index in weekly program (defaults to current day of week)
  const currentDayIndex = useMemo(() => {
    const day = new Date().getDay(); // 0 is Sunday
    // Map to Monday-based index: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
    return day === 0 ? 6 : day - 1;
  }, []);

  const [selectedProgramDay, setSelectedProgramDay] = useState(currentDayIndex);
  const [programViewMode, setProgramViewMode] = useState<"day" | "all">("day");

  const setActiveTab = (tab: TabId) => {
    setActiveTabState(tab);
    setSelectedShowId(null);
    setIsMobileMenuOpen(false);
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

  // Prevent background scrolling when modal or mobile menu is open
  useEffect(() => {
    if (selectedShowId || isOpenCallModalOpen || isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedShowId, isOpenCallModalOpen, isMobileMenuOpen]);

  // Ticker to re-evaluate live show status every 15 seconds (paused when tab or screen is hidden)
  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        setNowTick(Date.now());
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const timer = setInterval(() => {
      if (document.visibilityState !== "hidden") {
        setNowTick(Date.now());
      }
    }, 15000);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Dynamically compute live, next, and later shows according to current day and exact time
  const { currentLiveShow, nextShow, laterShow } = useMemo(() => {
    const now = new Date();
    const daysMapEN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const daysMapGR = ["Κυρ", "Δευ", "Τρι", "Τετ", "Πεμ", "Παρ", "Σαβ"];
    const todayAbbrGR = daysMapGR[now.getDay()];
    const todayAbbrEN = daysMapEN[now.getDay()];
    
    const currentSchedule = activeSchedule;
    const todayProgram = currentSchedule.find(d => d.day === todayAbbrGR || d.day === todayAbbrEN) || currentSchedule[0];
    const shows = todayProgram?.shows || [];
    
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const parseTimeRange = (timeStr: string) => {
      const parts = timeStr.split("-").map(s => s.trim());
      if (parts.length === 2) {
        const [sH, sM] = parts[0].split(":").map(Number);
        const [eH, eM] = parts[1].split(":").map(Number);
        let startMin = (sH || 0) * 60 + (sM || 0);
        let endMin = (eH || 0) * 60 + (eM || 0);
        if (endMin <= startMin) endMin += 24 * 60;
        return { startMin, endMin };
      }
      return { startMin: 0, endMin: 0 };
    };

    const getCountdownText = (diffMin: number, isGreekLang: boolean): string => {
      if (diffMin <= 0) return isGreekLang ? "Τώρα" : "Now";
      if (diffMin < 60) {
        return diffMin === 1 
          ? (isGreekLang ? "Σε 1 λεπτό" : "In 1 min")
          : (isGreekLang ? `Σε ${diffMin} λεπτά` : `In ${diffMin} min`);
      }
      const hours = Math.round(diffMin / 60);
      if (hours < 24) {
        return hours === 1
          ? (isGreekLang ? "Σε 1 ώρα" : "In 1 hour")
          : (isGreekLang ? `Σε ${hours} ώρες` : `In ${hours} hours`);
      }
      const days = Math.round(diffMin / (24 * 60));
      return days === 1
        ? (isGreekLang ? "Σε 1 μέρα" : "In 1 day")
        : (isGreekLang ? `Σε ${days} μέρες` : `In ${days} days`);
    };
    
    let active: any = null;
    let next: any = null;
    let later: any = null;
    
    // 1. Check today's shows
    for (let i = 0; i < shows.length; i++) {
      const show = shows[i];
      const { startMin, endMin } = parseTimeRange(show.time);
      
      if (nowMinutes >= startMin && nowMinutes < endMin) {
        active = { ...show, isLive: true };
      } else if (startMin > nowMinutes) {
        const diff = startMin - nowMinutes;
        const candidate = {
          ...show,
          timeLabel: show.time,
          countdown: getCountdownText(diff, isGreek),
          badge: isGreek ? "ΕΠΟΜΕΝΟ" : "NEXT",
          diffMinutes: diff
        };
        if (!next) {
          next = candidate;
        } else if (!later) {
          later = { ...candidate, badge: isGreek ? "ΣΤΗ ΣΥΝΕΧΕΙΑ" : "LATER" };
          break;
        }
      }
    }
    
    // 2. Look ahead to upcoming days if next or later is not yet found
    if (!next || !later) {
      for (let offset = 1; offset <= 7; offset++) {
        const nextDayIdx = (now.getDay() + offset) % 7;
        const nextDayAbbrGR = daysMapGR[nextDayIdx];
        const nextDayAbbrEN = daysMapEN[nextDayIdx];
        const nextDayProgram = currentSchedule.find(d => d.day === nextDayAbbrGR || d.day === nextDayAbbrEN);
        
        if (nextDayProgram && nextDayProgram.shows && nextDayProgram.shows.length > 0) {
          const nextDayShows = nextDayProgram.shows;
          for (let j = 0; j < nextDayShows.length; j++) {
            const candidate = nextDayShows[j];
            const { startMin } = parseTimeRange(candidate.time);
            const diff = (offset * 24 * 60) + startMin - nowMinutes;

            const isTomorrow = offset === 1;
            const dayName = isTomorrow 
              ? (isGreek ? "Αύριο" : "Tomorrow") 
              : nextDayProgram.fullName;
              
            const candidateWithLabel = {
              ...candidate,
              timeLabel: `${dayName} • ${candidate.time}`,
              countdown: getCountdownText(diff, isGreek),
              badge: isTomorrow 
                ? (isGreek ? "ΑΥΡΙΟ" : "TOMORROW") 
                : (isGreek ? "ΠΡΟΣΕΧΩΣ" : "UPCOMING"),
              diffMinutes: diff
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
  }, [isGreek, nowTick, activeSchedule]);

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
      navContact: "Επικοινωνία",
      listenBtn: "ΑΚΡΟΑΣΗ",
      playingBtn: "ΠΑΙΖΕΙ ΤΩΡΑ",
      heroTitle1: "FRS UTH",
      heroPrefix: "Online ",
      heroTitle2: "24/7.",
      heroSub: "Το φοιτητικό ραδιόφωνο του Πανεπιστημίου Θεσσαλίας. Μουσική, εκπομπές και συζητήσεις από φοιτητές, ζωντανά κάθε μέρα.",
      listenLive: "Ακούστε Ζωντανά",
      liveChat: "Live Chat",
      stat1: "24/7",
      stat1Sub: "Online Ροή",
      stat2: "40+",
      stat2Sub: "Παραγωγοί",
      stat3: "100%",
      stat3Sub: "Ανεξάρτητο",
      nowOnAir: "ΤΩΡΑ ΣΤΟΝ ΑΕΡΑ",
      studioLocation: "Online Broadcast",
      autoStreamTitle: "Μουσική Ροή FRS UTH",
      autoStreamSub: "Non-Stop Μουσική",
      upcomingShowsTag: "ΕΠΟΜΕΝΕΣ ΕΚΠΟΜΠΕΣ",
      todaysScheduleTitle: "Το Σημερινό Πρόγραμμα",
      fullWeekLink: "Πλήρες Πρόγραμμα Εβδομάδας",
      noLiveShow: "Δεν μεταδίδεται ζωντανή εκπομπή αυτή τη στιγμή",
      autoStreamDesc: "Συνεχής μουσική ροή με επιλογές από την ομάδα του σταθμού.",
      eventsTag: "ΔΡΑΣΤΗΡΙΟΤΗΤΕΣ & PARTIES",
      eventsTitle: "Εκδηλώσεις του Σταθμού",
      eventsDesc: "Μάθετε για τα επόμενά μας πάρτι. Όλες οι ημερομηνίες και οι τοποθεσίες, για να μη χάσετε κανένα.",
      openCallBadge: "OPEN CALL 2026",
      openCallTitle: "Θέλεις τη δική σου εκπομπή;",
      openCallSub: "Οι αιτήσεις για νέους ραδιοφωνικούς παραγωγούς του επόμενου εξαμήνου άνοιξαν. Γίνε μέλος της ομάδας μας.",
      applyNow: "Κάνε Αίτηση Τώρα",
      footerDesc: "Φοιτητικός Ραδιοφωνικός Σταθμός από φοιτητές του Πανεπιστημίου Θεσσαλίας. Αυτόνομη έκφραση, μουσική και επικοινωνία φοιτητών από το 2022.",
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
      navContact: "Contact",
      listenBtn: "LISTEN LIVE",
      playingBtn: "NOW PLAYING",
      heroTitle1: "FRS UTH",
      heroPrefix: "Online ",
      heroTitle2: "24/7.",
      heroSub: "The student radio station of the University of Thessaly. Music, shows, and discussions by students, live every day.",
      listenLive: "Listen Live",
      liveChat: "Live Chat",
      stat1: "24/7",
      stat1Sub: "Online Stream",
      stat2: "40+",
      stat2Sub: "Producers",
      stat3: "100%",
      stat3Sub: "Independent",
      nowOnAir: "NOW ON AIR",
      studioLocation: "Online Broadcast",
      autoStreamTitle: "FRS UTH Music Stream",
      autoStreamSub: "Non-Stop Music",
      upcomingShowsTag: "UPCOMING BROADCASTS",
      todaysScheduleTitle: "Today's Schedule",
      fullWeekLink: "Full Weekly Schedule",
      noLiveShow: "No live broadcast currently on air",
      autoStreamDesc: "Continuous music stream selected by the station team.",
      eventsTag: "ACTIVITIES & PARTIES",
      eventsTitle: "Station Events",
      eventsDesc: "Find out about our upcoming parties. All dates and locations, so you don't miss a single one.",
      openCallBadge: "OPEN CALL 2026",
      openCallTitle: "Want your own radio show?",
      openCallSub: "Applications for new student radio hosts and producers for next semester are now open. Join our team.",
      applyNow: "Apply Now",
      footerDesc: "Student Radio Station by students of the University of Thessaly. Autonomous expression, music, and student connection since 2022.",
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
    setIsLoadingAudio(true);
    setStationPlaying(true);
  };

  const getShowDetails = (idOrTitle: string) => {
    const showsData = isGreek ? SHOWS_DESCRIPTIONS_GR : SHOWS_DESCRIPTIONS_EN;
    if (!idOrTitle) return showsData[0];

    const allWeeklyShows = activeSchedule.flatMap(d => d.shows);
    const weeklyShow = allWeeklyShows.find(s => 
      s.id === idOrTitle || 
      s.title.toLowerCase().trim() === idOrTitle.toLowerCase().trim()
    );

    if (weeklyShow && weeklyShow.description?.trim()) {
      const matchingStatic = showsData.find(s => 
        s.id === weeklyShow.id || 
        s.title.toLowerCase().trim() === weeklyShow.title.toLowerCase().trim()
      );
      return {
        id: weeklyShow.id,
        title: weeklyShow.title,
        host: weeklyShow.host,
        description: weeklyShow.description,
        tags: weeklyShow.tags && weeklyShow.tags.length > 0 ? weeklyShow.tags : (matchingStatic?.tags || ["#Radio", "#FRSUTH"]),
        image: matchingStatic?.image || "/hero-studio.jpg"
      };
    }

    let show = showsData.find(s => s.id === idOrTitle);
    if (show) return show;

    show = showsData.find(s => 
      s.title.toLowerCase().trim() === idOrTitle.toLowerCase().trim() ||
      s.title.toLowerCase().includes(idOrTitle.toLowerCase()) ||
      idOrTitle.toLowerCase().includes(s.title.toLowerCase())
    );
    if (show) return show;

    if (weeklyShow) {
      return {
        id: weeklyShow.id,
        title: weeklyShow.title,
        host: weeklyShow.host,
        description: weeklyShow.description?.trim() 
          ? weeklyShow.description 
          : (isGreek 
            ? `Ζωντανή εκπομπή "${weeklyShow.title}" στο FRS UTH με παραγωγό ${weeklyShow.host}. Συντονιστείτε για τις καλύτερες μουσικές επιλογές.`
            : `Live show "${weeklyShow.title}" on FRS UTH hosted by ${weeklyShow.host}. Tune in for the finest music rotation.`),
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

  const currentLiveShowDetails = useMemo(() => {
    return currentLiveShow ? getShowDetails(currentLiveShow.id || currentLiveShow.title) : null;
  }, [currentLiveShow, isGreek, activeSchedule]);

  const nextShowDetails = useMemo(() => {
    return nextShow ? getShowDetails(nextShow.id || nextShow.title) : null;
  }, [nextShow, isGreek, activeSchedule]);

  const laterShowDetails = useMemo(() => {
    return laterShow ? getShowDetails(laterShow.id || laterShow.title) : null;
  }, [laterShow, isGreek, activeSchedule]);

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

  const weeklyScheduleList = activeSchedule;

  // Precise scrolling to the studio hero card & player view as shown on mobile
  const scrollToLiveStation = () => {
    if (activeTab !== "home") {
      setActiveTab("home");
    }

    setTimeout(() => {
      const studioEl = document.getElementById("hero-studio-card");
      if (studioEl) {
        const headerOffset = 64;
        const elementPosition = studioEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      } else {
        const playerEl = document.getElementById("floating-player-section");
        if (playerEl) {
          playerEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }, activeTab !== "home" ? 150 : 20);
  };

  // 1. Initial configuration gate: if config is still resolving for a first-time visitor and user is not admin, show seamless branded canvas
  if (!isConfigReady && !isAdmin) {
    return (
      <div className="fixed inset-0 z-[99999] bg-[#F7F4EC] flex items-center justify-center select-none">
        <UthLogo size="header" hideTextOnMobile={false} />
      </div>
    );
  }

  // 2. Coming Soon Gate: if Coming Soon is active globally and user is not authenticated admin, render ONLY the Coming Soon screen
  if (siteConfig.isComingSoon && !isAdmin) {
    return (
      <ComingSoonOverlay
        isGreek={isGreek}
        onDeactivate={async () => {
          await setComingSoonMode(false);
        }}
        onAdminAuthenticated={() => {
          setIsAdmin(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EC] text-[#1C1917] flex flex-col selection:bg-[#ad021a]/20 selection:text-[#ad021a] relative">
      
      {/* Ambient Glassmorphic Background Glow Orbs (Desktop only to prevent mobile GPU compositing artifacts) */}
      <div className="hidden md:block fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-24 right-[-10%] w-[520px] h-[520px] rounded-full bg-[#ad021a]/8 blur-[130px]" />
        <div className="absolute top-[35%] left-[-10%] w-[580px] h-[580px] rounded-full bg-amber-500/7 blur-[150px]" />
        <div className="absolute bottom-[10%] right-[15%] w-[480px] h-[480px] rounded-full bg-[#ad021a]/6 blur-[130px]" />
      </div>

      {/* 1. TOP NAVIGATION HEADER (Slim, Sleek & Glassmorphic) */}
      <header className="w-full sticky top-0 z-40 bg-[#F7F4EC]/95 md:bg-[#F7F4EC]/75 md:backdrop-blur-xl border-b border-black/[0.06] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 md:h-18 flex items-center justify-between">
          
          {/* Logo Brand */}
          <button
            type="button"
            onClick={() => setActiveTab("home")}
            className="cursor-pointer flex items-center hover:opacity-90 transition-opacity"
            aria-label="FRS UTH Web Radio"
          >
            <UthLogo size="header" hideTextOnMobile={true} />
          </button>

          {/* Desktop Navigation Links (Frosted Glass Dock with Smooth Horizontal Sliding Indicator) */}
          <nav className="hidden md:flex items-center h-10 gap-1 p-1 rounded-full bg-white/50 backdrop-blur-md border border-white/80 shadow-xs text-xs sm:text-sm font-semibold relative">
            {[
              { id: "home", label: currentT.navHome },
              { id: "program", label: currentT.navProgram },
              { id: "events", label: currentT.navEvents },
              { id: "archive", label: currentT.navArchive },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabId)}
                  className={`h-full flex items-center justify-center relative cursor-pointer transition-colors px-4 rounded-full z-10 ${
                    isActive ? "text-white font-bold" : "text-[#6B6560] hover:text-[#1C1917]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavTabIndicator"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      className="absolute inset-0 bg-[#ad021a] rounded-full shadow-xs -z-10"
                    />
                  )}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Actions (Language Pill, Listen Button, Mobile Hamburger) */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Language Switch Pill (with Smooth Sliding Spring Indicator) */}
            <div className="flex items-center h-10 bg-[#EFECE3] p-1 rounded-full text-xs font-bold text-[#6B6560] relative">
              <button
                onClick={() => setIsGreek(true)}
                className={`h-full flex items-center justify-center relative px-3 rounded-full transition-colors cursor-pointer z-10 ${
                  isGreek ? "text-[#1C1917] font-bold" : "hover:text-[#1C1917]"
                }`}
              >
                {isGreek && (
                  <motion.div
                    layoutId="activeLanguageIndicator"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    className="absolute inset-0 bg-white rounded-full shadow-xs -z-10"
                  />
                )}
                <span>GR</span>
              </button>
              <button
                onClick={() => setIsGreek(false)}
                className={`h-full flex items-center justify-center relative px-3 rounded-full transition-colors cursor-pointer z-10 ${
                  !isGreek ? "text-[#1C1917] font-bold" : "hover:text-[#1C1917]"
                }`}
              >
                {!isGreek && (
                  <motion.div
                    layoutId="activeLanguageIndicator"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    className="absolute inset-0 bg-white rounded-full shadow-xs -z-10"
                  />
                )}
                <span>EN</span>
              </button>
            </div>

            {/* Primary Red Listen Button */}
            <button
              onClick={() => {
                if (!stationPlaying) {
                  setIsLoadingAudio(true);
                  setStationPlaying(true);
                } else {
                  setStationPlaying(false);
                  setIsLoadingAudio(false);
                }
                scrollToLiveStation();
              }}
              className="h-10 flex items-center gap-2 bg-[#ad021a] hover:bg-[#8f0115] text-white px-4 rounded-full font-bold text-xs shadow-md shadow-[#ad021a]/20 hover:shadow-lg hover:shadow-[#ad021a]/30 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              {isLoadingAudio ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span className={`w-1.5 h-1.5 rounded-full bg-white ${stationPlaying ? "animate-ping" : ""}`} />
              )}
              <span>
                {isLoadingAudio 
                  ? (isGreek ? "Σύνδεση..." : "Connecting...") 
                  : (stationPlaying ? currentT.playingBtn : currentT.listenBtn)}
              </span>
            </button>

            {/* Mobile Hamburger Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden w-10 h-10 rounded-full bg-white border border-black/10 text-[#1C1917] flex items-center justify-center cursor-pointer shadow-xs hover:bg-[#FAF8F4] transition-all active:scale-95"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open navigation menu"}
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4 text-[#ad021a]" />
              ) : (
                <Menu className="w-4 h-4 text-[#1C1917]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE NAVIGATION DRAWER (Full-Screen / Slide-Down Editorial Menu) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="md:hidden fixed inset-x-0 top-14 sm:top-16 md:top-18 bottom-0 z-40 bg-[#F7F4EC] border-b border-black/10 overflow-y-auto flex flex-col justify-between p-6 shadow-2xl"
          >
            {/* Navigation Links */}
            <div className="flex flex-col gap-3 pt-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#ad021a] uppercase">
                {isGreek ? "ΜΕΝΟΥ ΠΛΟΗΓΗΣΗΣ" : "NAVIGATION MENU"}
              </span>

              <nav className="flex flex-col gap-2 mt-1">
                {[
                  { id: "home", num: "01", label: currentT.navHome },
                  { id: "program", num: "02", label: currentT.navProgram },
                  { id: "events", num: "03", label: currentT.navEvents },
                  { id: "archive", num: "04", label: currentT.navArchive },
                  { id: "contact", num: "05", label: currentT.navContact }
                ].map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as TabId)}
                      className={`flex items-center justify-between p-4 rounded-2xl transition-all text-left cursor-pointer ${
                        isActive
                          ? "bg-[#ad021a] text-white shadow-md shadow-[#ad021a]/20 font-bold"
                          : "bg-white text-[#1C1917] border border-black/[0.07] font-semibold hover:bg-[#FAF8F4]"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span className={`text-xs font-mono font-bold ${isActive ? "text-white/80" : "text-[#ad021a]"}`}>
                          {item.num}
                        </span>
                        <span className="font-editorial text-xl">
                          {item.label}
                        </span>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isActive ? "text-white" : "text-[#78716C]"}`} />
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Action Cards in Menu */}
            <div className="flex flex-col gap-3 pt-6 border-t border-black/[0.08] mt-6">
              
              {/* Live Chat CTA Button */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setChatOpen(true);
                  setHasUnreadChat(false);
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white border border-black/10 shadow-xs cursor-pointer hover:bg-[#FAF8F4] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FCECEE] text-[#ad021a] flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-[#1C1917]">{currentT.liveChat}</span>
                    <span className="text-[10px] text-[#78716C]">
                      {isGreek ? "Συνομιλήστε με τους ακροατές" : "Chat with listeners live"}
                    </span>
                  </div>
                </div>
                {hasUnreadChat && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ad021a] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ad021a]"></span>
                  </span>
                )}
              </button>

              {/* Open Call Button */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsOpenCallModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#1C1917] text-white shadow-md cursor-pointer hover:bg-black transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#ad021a]" />
                  <span className="text-xs font-bold">{currentT.openCallBadge}</span>
                </div>
                <span className="text-[11px] font-bold text-stone-300">{currentT.applyNow} →</span>
              </button>

              {/* Station Location Info */}
              <div className="text-center text-[11px] text-[#78716C] pt-2 font-mono">
                {currentT.cities}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <div className="lg:col-span-7 flex flex-col items-start text-left justify-center">

                  {/* Creative Bold Display Headline (Unbounded Ultra-Bold) */}
                  <h1 className="font-display text-4xl sm:text-6xl lg:text-[64px] leading-[1.04] font-black tracking-tight text-[#1C1917]">
                    {currentT.heroTitle1} <br />
                    <span className="text-[#1C1917]">{currentT.heroPrefix}</span>
                    <span className="text-[#ad021a]">{currentT.heroTitle2}</span>
                  </h1>

                  {/* Subtitle - Crisp, Legible & Strong */}
                  <p className="mt-5 sm:mt-6 text-base sm:text-lg text-[#3A3532] leading-relaxed max-w-xl font-medium">
                    {currentT.heroSub}
                  </p>

                  {/* Hero Action Buttons */}
                  <div className="mt-7 sm:mt-8 flex flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    {/* Primary Button */}
                    <button
                      onClick={() => {
                        setStationPlaying(!stationPlaying);
                        scrollToLiveStation();
                      }}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-[#ad021a] hover:bg-[#8f0115] text-white px-4 sm:px-7 py-3 sm:py-3.5 rounded-full font-bold text-xs sm:text-sm shadow-md shadow-[#ad021a]/25 hover:shadow-lg hover:shadow-[#ad021a]/35 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                    >
                      {stationPlaying ? (
                        <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white text-white shrink-0" />
                      ) : (
                        <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white text-white ml-0.5 shrink-0" />
                      )}
                      <span className="whitespace-nowrap">{currentT.listenLive}</span>
                    </button>

                    {/* Live Chat Button */}
                    <button
                      onClick={() => setChatOpen(true)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-white hover:bg-[#FAF8F4] text-[#1C1917] border border-black/10 px-4 sm:px-6 py-3 sm:py-3.5 rounded-full font-bold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                    >
                      <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ad021a] shrink-0" />
                      <span className="whitespace-nowrap">{currentT.liveChat}</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Unified Studio Visual & Live Player Card (Combined in same box) */}
                <div id="hero-studio-card" className="lg:col-span-5 relative scroll-mt-18">
                  <MainPlayer
                    isGreek={isGreek}
                    stationPlaying={stationPlaying}
                    setStationPlaying={setStationPlaying}
                    isLoadingAudio={isLoadingAudio}
                    setIsLoadingAudio={setIsLoadingAudio}
                    activeTrackId={activeTrackId}
                    currentLiveShow={currentLiveShow}
                    onOpenChat={() => setChatOpen(true)}
                    volume={volume}
                    setVolume={setVolume}
                    isMuted={isMuted}
                    setIsMuted={setIsMuted}
                  />
                </div>
              </section>

              {/* SECTION 2: TODAY'S SCHEDULE & PROGRAM */}
              <section id="floating-player-section" className="flex flex-col gap-10">
                {/* Today's Schedule Section with Spacious, Well-Aligned Cards */}
                <div className="flex flex-col gap-6">
                  {/* Section Title Header */}
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-black/[0.06] pb-4">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-grotesk font-bold text-[#ad021a] tracking-wider uppercase mb-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{currentT.upcomingShowsTag}</span>
                      </div>
                      <h2 className="font-display text-3xl sm:text-4xl font-black text-[#1C1917] tracking-tight">
                        {currentT.todaysScheduleTitle}
                      </h2>
                    </div>

                    <button
                      onClick={() => setActiveTab("program")}
                      className="text-xs sm:text-sm font-bold text-[#ad021a] hover:text-[#8f0115] flex items-center gap-1 cursor-pointer transition-colors self-start sm:self-auto group"
                    >
                      <span>{currentT.fullWeekLink}</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  {/* 3 Spacious Schedule Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Card 1: Currently Live / Automated Stream */}
                    <div 
                      onClick={() => currentLiveShow && handleOpenShowDescription(currentLiveShow)}
                      className={`warm-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between min-h-[220px] relative overflow-hidden cursor-pointer ${
                        currentLiveShow ? "border-l-4 border-l-[#ad021a]" : "border-t-2 border-t-[#ad021a]/40"
                      }`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-3.5">
                          <span className="text-xs font-mono font-bold text-[#6B6560] bg-[#FAF8F4] px-2.5 py-1 rounded-lg border border-black/5">
                            {currentLiveShow ? currentLiveShow.time : "Non-Stop Stream"}
                          </span>
                          <span className="bg-[#FCECEE] text-[#ad021a] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {currentLiveShow ? (isGreek ? "ΖΩΝΤΑΝΑ ΤΩΡΑ" : "LIVE NOW") : (isGreek ? "ΤΩΡΑ • ΜΟΥΣΙΚΗ ΡΟΗ" : "NOW • MUSIC STREAM")}
                          </span>
                        </div>

                        <h3 className="font-display font-black text-lg sm:text-xl text-[#1C1917] leading-snug tracking-tight">
                          {currentLiveShow ? currentLiveShow.title : currentT.noLiveShow}
                        </h3>

                        {currentLiveShow && (
                          <span className="text-xs font-bold text-[#ad021a] mt-1 flex items-center gap-1">
                            <Mic className="w-3.5 h-3.5" />
                            <span>{currentLiveShow.host}</span>
                          </span>
                        )}

                        <p className="text-xs sm:text-sm text-[#6B6560] mt-2 line-clamp-2 leading-relaxed">
                          {currentLiveShow 
                            ? (currentLiveShow.description || currentLiveShowDetails?.description || `Με παραγωγό ${currentLiveShow.host}`)
                            : currentT.autoStreamDesc}
                        </p>
                      </div>

                      <div className="mt-5 pt-3.5 border-t border-black/[0.05] flex items-center justify-between text-xs text-[#6B6560] font-semibold">
                        <span>{currentLiveShow ? (currentLiveShowDetails?.tags?.[0] || (isGreek ? "Ζωντανή Ροή" : "Live Stream")) : (isGreek ? "Ζωντανή Ροή" : "Live Stream")}</span>
                        <span className="w-2 h-2 rounded-full bg-[#ad021a]/70 animate-pulse" />
                      </div>
                    </div>

                    {/* Card 2: Next Show */}
                    <div 
                      onClick={() => nextShow && handleOpenShowDescription(nextShow)}
                      className="warm-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between min-h-[220px] cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-3.5">
                          <span className="text-xs font-mono font-bold text-[#6B6560] bg-[#FAF8F4] px-2.5 py-1 rounded-lg border border-black/5">
                            {nextShow ? (nextShow.timeLabel || nextShow.time) : "18:00 - 20:00"}
                          </span>
                          <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {nextShow?.badge || (isGreek ? "ΕΠΟΜΕΝΟ" : "NEXT")}
                          </span>
                        </div>

                        <h3 className="font-display font-black text-lg sm:text-xl text-[#1C1917] leading-snug tracking-tight">
                          {nextShow ? nextShow.title : "Global Grooves"}
                        </h3>

                        <span className="text-xs font-bold text-[#ad021a] mt-1 flex items-center gap-1">
                          <Mic className="w-3.5 h-3.5" />
                          <span>{nextShow ? nextShow.host : "World Tour"}</span>
                        </span>

                        <p className="text-xs sm:text-sm text-[#6B6560] mt-2 line-clamp-2 leading-relaxed">
                          {nextShow?.description || nextShowDetails?.description || (isGreek 
                            ? "Μουσική εκπομπή από την ομάδα του FRS UTH." 
                            : "Radio broadcast from the FRS UTH team.")}
                        </p>
                      </div>

                      <div className="mt-5 pt-3.5 border-t border-black/[0.05] flex items-center justify-between text-xs text-[#6B6560] font-semibold">
                        <span>{nextShowDetails?.tags?.[0] || (isGreek ? "Εκπομπή Σταθμού" : "Station Show")}</span>
                        <span className="text-[#6B6560] font-mono">{nextShow?.countdown || (isGreek ? "Σύντομα" : "Soon")}</span>
                      </div>
                    </div>

                    {/* Card 3: Evening / Later Show */}
                    <div 
                      onClick={() => laterShow && handleOpenShowDescription(laterShow)}
                      className="warm-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between min-h-[220px] cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-3.5">
                          <span className="text-xs font-mono font-bold text-[#6B6560] bg-[#FAF8F4] px-2.5 py-1 rounded-lg border border-black/5">
                            {laterShow ? (laterShow.timeLabel || laterShow.time) : "12:00 - 15:00"}
                          </span>
                          <span className="bg-stone-100 text-[#6B6560] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {laterShow?.badge || (isGreek ? "ΣΤΗ ΣΥΝΕΧΕΙΑ" : "LATER")}
                          </span>
                        </div>

                        <h3 className="font-display font-black text-lg sm:text-xl text-[#1C1917] leading-snug tracking-tight">
                          {laterShow ? laterShow.title : "Lazy Sunday"}
                        </h3>

                        <span className="text-xs font-bold text-[#ad021a] mt-1 flex items-center gap-1">
                          <Mic className="w-3.5 h-3.5" />
                          <span>{laterShow ? laterShow.host : "Chill Crew"}</span>
                        </span>

                        <p className="text-xs sm:text-sm text-[#6B6560] mt-2 line-clamp-2 leading-relaxed">
                          {laterShow?.description || laterShowDetails?.description || (isGreek 
                            ? "Μουσική εκπομπή από την ομάδα του FRS UTH." 
                            : "Radio broadcast from the FRS UTH team.")}
                        </p>
                      </div>

                      <div className="mt-5 pt-3.5 border-t border-black/[0.05] flex items-center justify-between text-xs text-[#6B6560] font-semibold">
                        <span>{laterShowDetails?.tags?.[0] || (isGreek ? "Εκπομπή Σταθμού" : "Station Show")}</span>
                        <span className="text-[#6B6560] font-mono">{laterShow?.countdown || (isGreek ? "Σύντομα" : "Soon")}</span>
                      </div>
                    </div>

                  </div>
                </div>
              </section>

              {/* SECTION 3: EVENTS & OPEN CALL (Image 3) */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                
                {/* Left Column: Station Events */}
                <div className="lg:col-span-6 flex flex-col justify-center gap-6">
                  <div>
                    <div className="text-xs font-grotesk font-bold text-[#ad021a] tracking-wider uppercase mb-1">
                      {currentT.eventsTag}
                    </div>
                    <h2 className="font-display text-3xl sm:text-4xl font-black text-[#1C1917] tracking-tight">
                      {currentT.eventsTitle}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6B6560] mt-1.5 line-clamp-2 max-w-lg leading-relaxed">
                      {currentT.eventsDesc}
                    </p>
                  </div>

                  {/* Events List Cards (Clickable to navigate to Events tab) */}
                  <div className="flex flex-col gap-3.5">
                    {activeEvents.length === 0 ? (
                      <div 
                        onClick={() => setActiveTab("events")}
                        className="warm-card rounded-2xl p-4 flex items-center justify-between gap-4 cursor-pointer group hover:border-[#ad021a]/40 transition-all"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-14 h-14 rounded-2xl bg-[#FCECEE] text-[#ad021a] flex flex-col items-center justify-center shrink-0 border border-[#F2C4C9]/60 group-hover:scale-105 transition-transform">
                            <Calendar className="w-6 h-6" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <h4 className="font-display font-bold text-sm sm:text-base text-[#1C1917] group-hover:text-[#ad021a] transition-colors truncate tracking-tight">
                              {isGreek ? "Δεν υπάρχουν επερχόμενα πάρτι" : "No upcoming parties"}
                            </h4>
                            <p className="text-xs text-[#6B6560] truncate mt-0.5">
                              {isGreek ? "Μείνετε συντονισμένοι, σύντομα θα ανακοινωθούν νέα πάρτι!" : "Stay tuned, new parties will be announced soon!"}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#78716C] group-hover:text-[#ad021a] group-hover:translate-x-1 transition-all shrink-0" />
                      </div>
                    ) : (
                      activeEvents.slice(0, 2).map((ev) => (
                        <div 
                          key={ev.id}
                          onClick={() => setActiveTab("events")}
                          className="warm-card rounded-2xl p-4 flex items-center justify-between gap-4 cursor-pointer group hover:border-[#ad021a]/40 transition-all"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-14 h-14 rounded-2xl bg-[#FCECEE] text-[#ad021a] flex flex-col items-center justify-center shrink-0 border border-[#F2C4C9]/60 group-hover:scale-105 transition-transform">
                              <span className="font-display font-black text-xl leading-none">{ev.dayNum}</span>
                              <span className="text-[10px] font-extrabold uppercase mt-0.5 tracking-wider">{ev.monthStr}</span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <h4 className="font-display font-bold text-sm sm:text-base text-[#1C1917] group-hover:text-[#ad021a] transition-colors truncate tracking-tight">
                                {ev.title}
                              </h4>
                              <p className="text-xs text-[#6B6560] truncate mt-0.5">
                                {ev.categoryBadge} • {ev.timeLocation}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#78716C] group-hover:text-[#ad021a] group-hover:translate-x-1 transition-all shrink-0" />
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right Column: Open Call Feature Card */}
                <div className="lg:col-span-6">
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-black/10 min-h-[300px] h-full flex flex-col justify-end p-6 sm:p-8 group">
                    <img
                      src="/concert-party.jpg"
                      alt="Student DJ concert party"
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />

                    <div className="relative z-10 flex flex-col items-start text-left">
                      <span className="bg-[#ad021a] text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider mb-3">
                        {currentT.openCallBadge}
                      </span>
                      
                      <h3 className="font-display text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
                        {currentT.openCallTitle}
                      </h3>

                      <p className="text-xs sm:text-sm text-stone-300 mt-2 max-w-md leading-relaxed font-medium">
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
              WEEKLY PROGRAM VIEW (Redesigned Spacious Layout & Alignment)
             ========================================================================= */}
          {activeTab === "program" && (
            <motion.div
              key="program"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-10 max-w-6xl mx-auto w-full"
            >
              {/* Program Header */}
              <div className="text-center max-w-2xl mx-auto flex flex-col items-center gap-3">
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#1C1917] tracking-tight">
                  {isGreek ? "Εβδομαδιαίο Πρόγραμμα" : "Weekly Program"}
                </h1>
                <p className="text-sm sm:text-base text-[#6B6560] leading-relaxed font-normal">
                  {isGreek 
                    ? "Συντονιστείτε στον ηχητικό παλμό της φοιτητικής μας ομάδας. 40+ ραδιοφωνικοί παραγωγοί, εκλεκτικές μουσικές επιλογές και live panels όλη την εβδομάδα."
                    : "Tune in to the sonic pulse of our student broadcast team. 40+ radio producers, curated rotations, and live panels all week long."}
                </p>
              </div>

              {/* View Mode Controls & Day Selector Pills */}
              <div className="flex flex-col items-center gap-5 w-full">
                
                {/* View Mode Tabs (Day View vs Full Week with Sliding Indicator) */}
                <div className="flex items-center bg-[#EFECE3] md:bg-white/55 md:backdrop-blur-md p-1 rounded-full text-xs font-bold text-[#6B6560] border border-black/[0.06] md:border-white/80 shadow-xs relative">
                  <button
                    onClick={() => setProgramViewMode("day")}
                    className={`relative px-4 py-1.5 rounded-full transition-colors cursor-pointer z-10 ${
                      programViewMode === "day" ? "text-[#1C1917] font-bold" : "hover:text-[#1C1917]"
                    }`}
                  >
                    {programViewMode === "day" && (
                      <motion.div
                        layoutId="programViewModePill"
                        transition={{ type: "spring", stiffness: 450, damping: 32 }}
                        className="absolute inset-0 bg-white rounded-full shadow-xs -z-10"
                      />
                    )}
                    <span>{isGreek ? "Ημερήσια Προβολή" : "Day by Day"}</span>
                  </button>
                  <button
                    onClick={() => setProgramViewMode("all")}
                    className={`relative px-4 py-1.5 rounded-full transition-colors cursor-pointer z-10 ${
                      programViewMode === "all" ? "text-[#1C1917] font-bold" : "hover:text-[#1C1917]"
                    }`}
                  >
                    {programViewMode === "all" && (
                      <motion.div
                        layoutId="programViewModePill"
                        transition={{ type: "spring", stiffness: 450, damping: 32 }}
                        className="absolute inset-0 bg-white rounded-full shadow-xs -z-10"
                      />
                    )}
                    <span>{isGreek ? "Επισκόπηση Εβδομάδας" : "Full Week Overview"}</span>
                  </button>
                </div>

                {/* Day Selector Buttons with Unified Border Dock & Sliding Indicator */}
                <div className="flex items-center justify-start sm:justify-center overflow-x-auto max-w-full pb-2 no-scrollbar px-1">
                  <div className="flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-full bg-white md:bg-white/55 md:backdrop-blur-md border border-black/[0.08] md:border-white/80 shadow-xs relative">
                    {weeklyScheduleList.map((dayProg, idx) => {
                      const isSelected = selectedProgramDay === idx;
                      const isToday = currentDayIndex === idx;
                      return (
                        <button
                          key={dayProg.day}
                          onClick={() => {
                            setSelectedProgramDay(idx);
                            setProgramViewMode("day");
                          }}
                          className={`relative shrink-0 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1.5 z-10 ${
                            isSelected
                              ? "text-white font-bold"
                              : "text-[#6B6560] hover:text-[#1C1917]"
                          }`}
                        >
                          {isSelected && (
                            <motion.div
                              layoutId="activeDayTabIndicator"
                              transition={{ type: "spring", stiffness: 450, damping: 32 }}
                              className="absolute inset-0 bg-[#ad021a] rounded-full shadow-md shadow-[#ad021a]/25 -z-10"
                            />
                          )}
                          <span>{dayProg.fullName || dayProg.day}</span>
                          {isToday && (
                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-[#ad021a]"}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Day-by-Day Spacious Grid */}
              {programViewMode === "day" && (
                <div className="w-full flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-black/[0.08] pb-3">
                    <h3 className="font-display text-2xl font-black text-[#1C1917] tracking-tight">
                      {(weeklyScheduleList[selectedProgramDay] || weeklyScheduleList[0])?.fullName || (weeklyScheduleList[selectedProgramDay] || weeklyScheduleList[0])?.day}
                    </h3>
                    <span className="text-xs font-mono font-bold text-[#6B6560] bg-[#FAF8F4] px-3 py-1 rounded-full border border-black/5">
                      {(weeklyScheduleList[selectedProgramDay] || weeklyScheduleList[0])?.shows?.length || 0} {isGreek ? "Εκπομπές" : "Shows"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {((weeklyScheduleList[selectedProgramDay] || weeklyScheduleList[0])?.shows || []).length === 0 ? (
                      <div className="col-span-full warm-card rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-[#FCECEE] text-[#ad021a] flex items-center justify-center border border-[#F2C4C9]/60 mb-1">
                          <Radio className="w-6 h-6" />
                        </div>
                        <h4 className="font-display font-bold text-lg text-[#1C1917]">
                          {isGreek ? "Δεν έχουν προγραμματιστεί εκπομπές για αυτή την ημέρα" : "No shows scheduled for this day"}
                        </h4>
                        <p className="text-xs sm:text-sm text-[#6B6560] max-w-md">
                          {isGreek 
                            ? "Ο σταθμός μεταδίδει συνεχή μουσική ροή (Non-stop playlist 24/7). Επιλέξτε άλλη ημέρα ή συντονιστείτε στο live stream!" 
                            : "The station broadcasts non-stop music selection 24/7. Select another day or tune in to the live stream!"}
                        </p>
                      </div>
                    ) : (
                      ((weeklyScheduleList[selectedProgramDay] || weeklyScheduleList[0])?.shows || []).map((show) => {
                        const isLive = currentLiveShow?.id === show.id;
                        return (
                          <div
                            key={show.id}
                            onClick={() => handleOpenShowDescription(show)}
                            className={`warm-card rounded-3xl p-6 flex flex-col justify-between min-h-[220px] cursor-pointer group relative overflow-hidden ${
                              isLive ? "border-l-4 border-l-[#ad021a] bg-[#FCECEE]/20" : ""
                            }`}
                          >
                            <div className="flex flex-col">
                              <div className="flex items-center justify-between mb-3.5">
                                <span className="text-xs font-mono font-bold text-[#6B6560] bg-[#FAF8F4] px-3 py-1 rounded-lg border border-black/5">
                                  {show.time}
                                </span>
                                {isLive && (
                                  <span className="bg-[#FCECEE] text-[#ad021a] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#ad021a] animate-pulse" />
                                    <span>LIVE</span>
                                  </span>
                                )}
                              </div>

                              <h4 className="font-bold text-xl text-[#1C1917] group-hover:text-[#ad021a] transition-colors leading-snug">
                                {show.title}
                              </h4>

                              <span className="text-xs font-bold text-[#ad021a] mt-1.5 flex items-center gap-1">
                                <Mic className="w-3.5 h-3.5" />
                                <span>{show.host}</span>
                              </span>

                              {show.description && (
                                <p className="text-xs sm:text-sm text-[#6B6560] mt-2 line-clamp-2 leading-relaxed">
                                  {show.description}
                                </p>
                              )}
                            </div>

                            <div className="mt-6 pt-3.5 border-t border-black/[0.05] flex items-center justify-between gap-2">
                              <div className="flex flex-wrap gap-1.5">
                                {show.tags.map(tag => (
                                  <span key={tag} className="text-[10px] bg-[#FAF8F4] text-[#6B6560] px-2.5 py-0.5 rounded-md font-semibold border border-black/5">
                                    {tag}
                                  </span>
                                ))}
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTuneChannel(show.id);
                                }}
                                className="text-xs font-bold text-[#ad021a] hover:text-[#8f0115] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                              >
                                <span>{isGreek ? "Ακρόαση" : "Listen"}</span>
                                <Play className="w-3 h-3 fill-current" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Full Week Overview Mode (Spacious 2-3 Columns) */}
              {programViewMode === "all" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                  {weeklyScheduleList.map((dayProg) => (
                    <div key={dayProg.day} className="flex flex-col gap-4 bg-white md:bg-white/60 md:backdrop-blur-md p-5 rounded-3xl border border-black/[0.07] md:border-white/80 shadow-xs">
                      <div className="flex items-center justify-between border-b border-black/[0.06] pb-2.5 px-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-base text-[#1C1917]">{dayProg.fullName}</span>
                        </div>
                        <span className="text-xs font-mono text-[#6B6560] font-semibold">
                          {dayProg.shows.length} {isGreek ? "εκπομπές" : "shows"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-3">
                        {dayProg.shows.map((show) => {
                          const isLive = currentLiveShow?.id === show.id;
                          return (
                            <div
                              key={show.id}
                              onClick={() => handleOpenShowDescription(show)}
                              className={`warm-card rounded-2xl p-4 flex flex-col gap-2 cursor-pointer group ${
                                isLive ? "border-l-4 border-l-[#ad021a] bg-[#FCECEE]/25" : ""
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-mono font-bold text-[#6B6560]">
                                  {show.time}
                                </span>
                                {isLive && (
                                  <span className="w-2 h-2 rounded-full bg-[#ad021a] animate-pulse" />
                                )}
                              </div>

                              <h5 className="font-bold text-sm text-[#1C1917] group-hover:text-[#ad021a] transition-colors leading-snug">
                                {show.title}
                              </h5>

                              <span className="text-[11px] font-semibold text-[#ad021a]">
                                {show.host}
                              </span>

                              {show.description && (
                                <p className="text-xs text-[#6B6560] mt-1 line-clamp-2 leading-relaxed">
                                  {show.description}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </motion.div>
          )}

          {/* =========================================================================
              EVENTS VIEW (Spacious Cards, Rich Descriptions, No Buttons)
             ========================================================================= */}
          {activeTab === "events" && (
            <motion.div
              key="events"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-10 max-w-5xl mx-auto w-full"
            >
              <div className="text-center max-w-2xl mx-auto flex flex-col items-center gap-3">
                <span className="text-xs font-grotesk font-bold text-[#ad021a] tracking-wider uppercase">
                  {currentT.eventsTag}
                </span>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#1C1917] tracking-tight">
                  {currentT.eventsTitle}
                </h1>
              </div>

              <div className="grid grid-cols-1 gap-6 w-full">
                {activeEvents.length === 0 ? (
                  <div className="warm-card rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-3xl bg-[#FCECEE] text-[#ad021a] flex items-center justify-center border border-[#F2C4C9]/60 mb-1">
                      <Calendar className="w-8 h-8" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-[#1C1917]">
                      {isGreek ? "Δεν υπάρχουν επερχόμενα πάρτι αυτή τη στιγμή" : "No upcoming parties at the moment"}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#6B6560] max-w-md leading-relaxed">
                      {isGreek 
                        ? "Μείνετε συντονισμένοι στο web radio του σταθμού, οι νέες ημερομηνίες και τοποθεσίες για τα επόμενα πάρτι θα ανακοινωθούν σύντομα."
                        : "Stay tuned to our web radio, dates and locations for our upcoming parties will be announced soon."}
                    </p>
                  </div>
                ) : (
                  activeEvents.map((ev) => (
                    <div 
                      key={ev.id}
                      className="warm-card rounded-3xl p-6 sm:p-8 md:p-9 flex flex-col md:flex-row items-start gap-6 lg:gap-8"
                    >
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#FCECEE] text-[#ad021a] flex flex-col items-center justify-center shrink-0 border border-[#F2C4C9] shadow-sm">
                        <span className="font-black text-2xl sm:text-3xl leading-none">{ev.dayNum}</span>
                        <span className="text-xs sm:text-sm font-extrabold uppercase mt-1 tracking-wider">{ev.monthStr}</span>
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-between gap-3 min-w-0">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="text-[11px] font-bold text-[#ad021a] bg-[#FCECEE] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              {ev.categoryBadge}
                            </span>
                            <span className="text-xs font-mono text-[#6B6560]">
                              {ev.timeLocation}
                            </span>
                          </div>

                          <h3 className="font-display text-xl sm:text-2xl lg:text-3xl font-black text-[#1C1917] leading-tight tracking-tight">
                            {ev.title}
                          </h3>

                          <p className="text-sm sm:text-base text-[#6B6560] mt-2.5 leading-relaxed">
                            {ev.description}
                          </p>
                        </div>

                        {ev.tags && ev.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-3 border-t border-black/[0.06]">
                            {ev.tags.map((tag) => (
                              <span key={tag} className="text-[11px] bg-[#FAF8F4] text-[#6B6560] px-3 py-1 rounded-lg font-semibold border border-black/5">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
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
                <span className="text-xs font-grotesk font-bold text-[#ad021a] tracking-wider uppercase">
                  {isGreek ? "ΑΡΧΕΙΟ ΕΚΠΟΜΠΩΝ" : "AUDIO VAULT"}
                </span>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#1C1917] tracking-tight">
                  {isGreek ? "Αρχείο Mixcloud" : "Mixcloud Archive"}
                </h1>
                <p className="text-sm text-[#6B6560] leading-relaxed">
                  {isGreek
                    ? "Ανακαλύψτε το αρχείο μας. Παλιές εκπομπές και φοιτητική ραδιοφωνική ιστορία αποθηκευμένα στο επίσημο κανάλι μας."
                    : "Discover our vault. Past broadcasts and student radio history preserved on our Mixcloud channel."}
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
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                        {item.date}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-base text-[#1C1917] group-hover:text-[#ad021a] transition-colors leading-snug">
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
                          className="text-xs font-bold text-[#ad021a] hover:text-[#8f0115] flex items-center gap-1"
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
                <span className="text-xs font-grotesk font-bold text-[#ad021a] tracking-wider uppercase">
                  {isGreek ? "ΕΠΙΚΟΙΝΩΝΙΑ" : "GET IN TOUCH"}
                </span>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#1C1917] tracking-tight">
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
                    <div className="w-10 h-10 rounded-xl bg-[#FCECEE] text-[#ad021a] flex items-center justify-center shrink-0">
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
                    <div className="w-10 h-10 rounded-xl bg-[#FCECEE] text-[#ad021a] flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#1C1917]">Email</h4>
                      <p className="text-xs text-[#6B6560] mt-1">
                        <a href="mailto:foithtikaradioshows@gmail.com" className="hover:text-[#ad021a] transition-colors">foithtikaradioshows@gmail.com</a>
                      </p>
                    </div>
                  </div>

                  <div className="warm-card rounded-2xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#FCECEE] text-[#ad021a] flex items-center justify-center shrink-0">
                      <Instagram className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#1C1917]">Instagram</h4>
                      <p className="text-xs text-[#6B6560] mt-1">
                        <a 
                          href="https://www.instagram.com/frs_uth.gr/" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="hover:text-[#ad021a] transition-colors font-medium"
                        >
                          @frs_uth.gr
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Form */}
                <div className="md:col-span-7 warm-card rounded-3xl p-6 sm:p-8">
                  {contactSubmitted ? (
                    <div className="flex flex-col items-center justify-center text-center py-8 gap-3">
                      <CheckCircle2 className="w-12 h-12 text-[#ad021a]" />
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
                        className="mt-4 px-6 py-2.5 rounded-full bg-[#ad021a] text-white font-bold text-xs hover:bg-[#8f0115] transition-colors cursor-pointer"
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

                        setContactLoading(false);
                        setContactSubmitted(true);
                        setContactForm({
                          name: "",
                          email: "",
                          category: "general",
                          message: ""
                        });
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
                          maxLength={100}
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
                          maxLength={120}
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
                          maxLength={2500}
                          value={contactForm.message}
                          onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                          placeholder={isGreek ? "Γράψτε το μήνυμά σας..." : "Write your message..."}
                          className="field resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={contactLoading}
                        className="w-full bg-[#ad021a] hover:bg-[#8f0115] text-white font-bold py-3 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#ad021a]/20"
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
                <li>
                  <button onClick={() => setActiveTab("contact")} className="hover:text-white transition-colors cursor-pointer">
                    {currentT.navContact}
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
              <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                <a
                  href="https://www.instagram.com/frs_uth.gr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-white px-4 py-2.5 rounded-full font-bold text-xs transition-all w-fit shadow-md group"
                >
                  <Instagram className="w-4 h-4 text-[#ad021a] group-hover:scale-110 transition-transform" />
                  <span>@frs_uth.gr</span>
                </a>
                <a
                  href="https://www.mixcloud.com/frs-volou/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-white px-4 py-2.5 rounded-full font-bold text-xs transition-all w-fit shadow-md group"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ad021a] group-hover:scale-110 transition-transform" />
                  <span>{currentT.mixcloudBtn}</span>
                </a>
              </div>
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

      {/* FLOATING LIVE POLL ALERT BADGE (Visible when active poll exists and chat is closed) */}
      <AnimatePresence>
        {activePoll && activePoll.isActive && Date.now() < activePoll.expiresAt && !chatOpen && !isMobileMenuOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 15 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setChatOpen(true)}
            title={activePoll.question}
            className="fixed bottom-20 right-6 z-30 bg-[#ad021a] hover:bg-[#8f0115] text-white px-4 py-2.5 rounded-full font-bold text-xs shadow-xl shadow-[#ad021a]/25 flex items-center justify-center gap-2 cursor-pointer transition-all border border-[#ad021a]/30 min-w-[122px] group"
          >
            <BarChart2 className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
            <span>Live Poll</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* FLOATING QUICK-ACCESS LIVE CHAT BUTTON (Visible only when chat is closed) */}
      <AnimatePresence>
        {!chatOpen && !isMobileMenuOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setChatOpen(true);
              setHasUnreadChat(false);
            }}
            className="fixed bottom-6 right-6 z-30 bg-white hover:bg-[#FAF8F4] text-[#1C1917] border border-black/10 px-4 py-2.5 rounded-full font-bold text-xs shadow-xl shadow-black/10 flex items-center justify-center gap-2 cursor-pointer group min-w-[122px]"
          >
            {hasUnreadChat && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ad021a] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ad021a]"></span>
              </span>
            )}
            <MessageSquare className="w-4 h-4 text-[#ad021a] group-hover:scale-110 transition-transform shrink-0" />
            <span>Live Chat</span>
          </motion.button>
        )}
      </AnimatePresence>

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
                className="w-full max-w-xl bg-[#F7F4EC] md:bg-[#F7F4EC]/92 md:backdrop-blur-2xl rounded-3xl p-6 sm:p-7 shadow-2xl border border-black/10 md:border-white/80 relative my-auto"
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
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {selectedShow.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-[#FCECEE] text-[#ad021a] px-2.5 py-0.5 rounded-full font-bold">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h2 className="font-display text-2xl sm:text-3xl font-black text-[#1C1917] tracking-tight">
                      {selectedShow.title}
                    </h2>
                    <p className="text-xs font-bold text-[#ad021a] mt-0.5">
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
                      className="flex-1 bg-[#ad021a] hover:bg-[#8f0115] text-white py-3 px-5 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#ad021a]/20"
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
              className="w-full max-w-lg bg-[#F7F4EC] md:bg-[#F7F4EC]/92 md:backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-black/10 md:border-white/80 relative my-auto"
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
                  <CheckCircle2 className="w-14 h-14 text-[#ad021a]" />
                  <h3 className="font-display text-2xl font-black text-[#1C1917] tracking-tight">
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
                    className="mt-4 px-6 py-2.5 rounded-full bg-[#ad021a] text-white font-bold text-xs cursor-pointer"
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
                      await saveOpenCallApplication({
                        name: openCallForm.name,
                        email: openCallForm.email,
                        showConcept: openCallForm.showConcept,
                        musicGenres: openCallForm.musicGenres,
                        phone: openCallForm.phone
                      });
                    } catch (err) {
                      console.error("Error saving open call application:", err);
                    }

                    setOpenCallLoading(false);
                    setOpenCallSubmitted(true);
                    setOpenCallForm({
                      name: "",
                      email: "",
                      phone: "",
                      showConcept: "",
                      musicGenres: ""
                    });
                  }}
                  className="flex flex-col gap-3.5"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-[#ad021a] uppercase">
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
                    className="w-full bg-[#ad021a] hover:bg-[#8f0115] text-white font-bold py-3 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#ad021a]/20 mt-2"
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

      {/* LIVE CHAT MODAL / DRAWER */}
      <LiveChat
        isGreek={isGreek}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        onActiveTrackTrigger={handleTuneChannel}
        currentLiveShow={currentLiveShow}
        stationPlaying={stationPlaying}
        setStationPlaying={setStationPlaying}
        isLoadingAudio={isLoadingAudio}
        setIsLoadingAudio={setIsLoadingAudio}
        volume={volume}
        setVolume={setVolume}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        activePoll={activePoll}
        onUnreadChange={setHasUnreadChat}
        isComingSoon={siteConfig.isComingSoon}
        onToggleComingSoon={setComingSoonMode}
        isAdmin={isAdmin}
      />

      {/* DISCREET ADMIN PREVIEW BAR (When Coming Soon is active globally but admin is previewing) */}
      {siteConfig.isComingSoon && isAdmin && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-3 bg-[#1C1917]/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-stone-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff4b62] animate-pulse shrink-0" />
            <span className="font-semibold text-stone-300">
              {isGreek ? "Προεπισκόπηση Admin (Το Coming Soon φαίνεται στους επισκέπτες)" : "Admin Preview (Coming Soon active for visitors)"}
            </span>
          </div>
          <button
            type="button"
            onClick={async () => {
              await setComingSoonMode(false);
            }}
            className="bg-[#ad021a] hover:bg-[#8f0115] text-white font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 whitespace-nowrap"
          >
            {isGreek ? "Άνοιγμα Σάιτ για Όλους" : "Publish Site for Everyone"}
          </button>
          <button
            type="button"
            onClick={() => {
              logoutAdmin();
              setIsAdmin(false);
            }}
            className="text-stone-400 hover:text-white px-2 py-1 text-xs cursor-pointer font-medium"
            title={isGreek ? "Έξοδος" : "Exit"}
          >
            {isGreek ? "Έξοδος" : "Exit"}
          </button>
        </div>
      )}

    </div>
  );
}