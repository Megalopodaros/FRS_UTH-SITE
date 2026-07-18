/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
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
  Pause
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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

export default function App() {
  const [activeTab, setActiveTabState] = useState<"home" | "program" | "descriptions" | "archive">("home");
  const setActiveTab = (tab: "home" | "program" | "descriptions" | "archive") => {
    setActiveTabState(tab);
    setSelectedShowId(null);
  };
  const [isGreek, setIsGreek] = useState(true);
  const [stationPlaying, setStationPlaying] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  
  const [activeTrackId, setActiveTrackId] = useState<string>("");
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);

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
      navProgram: "Εβδομαδιαίο Πρόγραμμα",
      navDesc: "Περιγραφές Εκπομπών",
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
      joinedCommunity: "Συνομιλήστε με κοινότητα",
      secUnder: "Εξερευνήστε το FRS Ecosystem",
      leadDesc: "Βουτήξτε βαθιά στα ηχητικά τοπία των φοιτητών μας. Ανακαλύψτε τις φωνές που διαμορφώνουν τον ηλεκτρικό μας παλμό.",
      archiveHeader: "Αρχείο Εκπομπών",
      archiveSub: "Βουτήξτε στο αρχείο μας. Παλιές εκπομπές, θρύλικά sets και αυθεντική φοιτητική ενέργεια, αποθηκευμένα στο Mixcloud.",
      searchPlaceholder: "Αναζήτηση εκπομπών, DJs, ειδών...",
      sortNewest: "Πιο Πρόσφατα",
      sortPopular: "Πιο Δημοφιλή",
      loadMore: "Φόρτωση Περισσότερων",
      loading: "Φόρτωση...",
      noResults: "Δεν βρέθηκαν αποτελέσματα.",
      listenMixcloud: "Ακούστε στο Mixcloud"
    },
    en: {
      navHome: "Home",
      navProgram: "Weekly Program",
      navDesc: "Show Descriptions",
      navArchive: "Mixcloud Archive",
      listenBtn: "Listen Live",
      playingBtn: "Playing",
      undergroundSub: "Foititika Radio Show. Built for students, by students. Tune in for underground beats, campus news, and raw energy.",
      pulseTitle: "The Sonic Pulse of Campus.",
      todaysSchedule: "Today's Schedule",
      fullProgram: "View Full Program",
      liveIndicator: "LIVE",
      nextIndicator: "NEXT",
      studentsOnline: "142 Students Online",
      joinedCommunity: "Chat with community",
      secUnder: "Explore the FRS Ecosystem",
      leadDesc: "Dive deep into the sonic landscapes curated by our student broadcasters. Discover the voices shaping our electric pulse.",
      archiveHeader: "Archive Vault",
      archiveSub: "Dive into the vault. Past broadcasts, legendary sets, and raw student energy, preserved on Mixcloud.",
      searchPlaceholder: "Search shows, DJs, genres...",
      sortNewest: "Newest First",
      sortPopular: "Most Popular",
      loadMore: "Load More Archives",
      loading: "Loading...",
      noResults: "No archives found.",
      listenMixcloud: "Listen on Mixcloud"
    }
  };

  const currentT = isGreek ? t.gr : t.en;

  // Language automatic detection or simple configuration
  const toggleLanguage = () => {
    setIsGreek(!isGreek);
  };

  const handleTabChange = (tab: "home" | "program" | "descriptions" | "archive") => {
    setActiveTab(tab);
    setSelectedShowId(null);
  };

  // Helper triggers to tune channel from any show block clicking
  const handleTuneChannel = (trackId: string) => {
    setActiveTrackId(trackId);
    setStationPlaying(true);
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
          className="absolute -top-20 left-[15%] w-[480px] h-[480px] bg-[#c1cc94]/12 rounded-full filter blur-[140px]"
        />
        <motion.div
          animate={{
            x: [0, -70, 50, 0],
            y: [0, 80, -30, 0],
            scale: [1, 0.85, 1.15, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[35%] right-[10%] w-[550px] h-[550px] bg-white/[0.04] rounded-full filter blur-[140px]"
        />
        <motion.div
          animate={{
            x: [0, 60, -50, 0],
            y: [0, -50, 60, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[10%] left-[25%] w-[500px] h-[500px] bg-[#b3be87]/10 rounded-full filter blur-[150px]"
        />
      </div>

      {/* HEADER SECTION (Desktop) */}
      <nav className="w-full sticky top-0 glass-navbar transition-all duration-300 z-40">
        <div className="flex justify-between items-center px-6 py-4 max-w-screen-xl mx-auto w-full">
          <div 
            onClick={() => handleTabChange("home")}
            className="font-headline text-2xl font-bold text-primary tracking-tighter cursor-pointer flex items-center gap-2"
          >
            <Radio className="w-6 h-6 text-primary animate-pulse" />
            <span>FRS</span>
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
                    <div className="absolute -inset-4 rounded-full bg-[#c1cc94]/25 filter blur-3xl animate-pulse"></div>
                    <motion.button
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setStationPlaying(!stationPlaying)}
                      id="hero-play-accent"
                      className="w-26 h-26 rounded-full bg-gradient-to-b from-white/25 to-white/5 p-[1px] flex items-center justify-center shadow-[0_24px_50px_rgba(0,0,0,0.8),_0_0_40px_rgba(193,204,148,0.3)] cursor-pointer relative z-10 group"
                    >
                      <div className="w-full h-full rounded-full bg-[#141418]/90 backdrop-blur-3xl group-hover:bg-[#1f1f25]/95 transition-all flex items-center justify-center border border-white/10">
                        {stationPlaying ? (
                          <Pause className="w-10 h-10 text-[#c1cc94] fill-[#c1cc94] drop-shadow-[0_0_15px_rgba(193,204,148,0.7)]" />
                        ) : (
                          <Play className="w-10 h-10 text-[#c1cc94] fill-[#c1cc94] drop-shadow-[0_0_15px_rgba(193,204,148,0.7)] ml-1" />
                        )}
                      </div>
                    </motion.button>
                  </div>

                  {/* INTERACTIVE COMMUNITY CHAT TRIGGER */}
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => {
                        const el = document.getElementById("inline-live-chat");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                        else setChatOpen(true);
                      }}
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
                    <span>{isGreek ? "Εβδομαδιαίο Πρόγραμμα & Σήμερα" : "Weekly & Today's Schedule"}</span>
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
                  <div className="glass-card p-5 rounded-2xl border border-primary/50 relative overflow-hidden glow-primary shadow-xl group transition-all duration-200">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-transparent pointer-events-none" />
                    <div className="relative z-10 flex flex-col gap-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-primary font-mono">18:00 - 20:00</span>
                        <div className="flex items-center gap-1.5 bg-primary/25 px-2.5 py-0.5 rounded-full text-[10px] text-primary font-bold uppercase backdrop-blur-md shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          <span>{currentT.liveIndicator}</span>
                        </div>
                      </div>
                      <h3 className="font-headline text-lg font-bold text-primary mt-1">Electric Avenue</h3>
                      <p className="text-xs text-on-surface-variant font-medium">DJ Nova • Techno</p>
                    </div>
                  </div>

                  {/* NEXT CARD */}
                  <div className="glass-card p-5 rounded-2xl border border-white/10 transition-all duration-200 shadow-lg group">
                    <div className="flex flex-col gap-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-on-surface-variant font-mono">21:00 - 23:00</span>
                        <span className="text-[10px] font-bold text-on-surface-variant/80 border border-white/15 px-2 py-0.5 rounded uppercase glass-pill">
                          {currentT.nextIndicator}
                        </span>
                      </div>
                      <h3 className="font-headline text-lg font-bold text-primary mt-1">Deep Space</h3>
                      <p className="text-xs text-on-surface-variant font-medium">The Cosmonaut • Ambient</p>
                    </div>
                  </div>

                  {/* LATER CARD */}
                  <div className="glass-card p-5 rounded-2xl border border-white/10 transition-all duration-200 shadow-lg group">
                    <div className="flex flex-col gap-2.5">
                      <span className="text-xs font-semibold text-on-surface-variant font-mono">00:00 - 02:00</span>
                      <h3 className="font-headline text-lg font-bold text-primary mt-1">Midnight Sessions</h3>
                      <p className="text-xs text-on-surface-variant font-medium">DJ Kyriakos • Lofi / Chill</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* INTEGRATED LIVE STREAM CHAT INLINE - PLACED BELOW SCHEDULE */}
              <section className="w-full max-w-4xl flex flex-col mt-4">
                <LiveChat 
                  isGreek={isGreek}
                  isOpen={true}
                  onClose={() => {}}
                  onActiveTrackTrigger={handleTuneChannel}
                  isInline={true}
                />
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

              {/* MOBILE DAY HORIZONTAL SCROLL SELECTOR */}
              <div className="md:hidden flex overflow-x-auto gap-2 pb-3 w-full no-scrollbar snap-x">
                {(isGreek ? WEEKLY_SCHEDULE_GR : WEEKLY_SCHEDULE_EN).map((dayProg, idx) => (
                  <button
                    key={dayProg.day}
                    onClick={() => setSelectedMobileDay(idx)}
                    className={`snap-start flex-shrink-0 px-6 py-2.5 rounded-full font-bold text-xs transition-all border cursor-pointer ${
                      selectedMobileDay === idx
                        ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/20"
                        : "glass-pill hover:border-primary/50"
                    }`}
                  >
                    {dayProg.day}
                  </button>
                ))}
              </div>

              {/* DESKTOP 7-COLUMN GRID */}
              <div className="hidden md:grid grid-cols-7 gap-4 w-full items-start mt-4">
                {(isGreek ? WEEKLY_SCHEDULE_GR : WEEKLY_SCHEDULE_EN).map((dayProg) => (
                  <div 
                    key={dayProg.day}
                    className="flex flex-col gap-4"
                  >
                    <div className="font-headline text-sm font-bold text-primary border-b border-white/15 pb-2 uppercase tracking-widest text-center glass-pill py-1.5 rounded-xl">
                      {dayProg.day}
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      {dayProg.shows.map((show) => (
                        <div
                          key={show.id}
                          className={`p-3.5 rounded-2xl border flex flex-col gap-2 text-left transition-all duration-200 shadow-md ${
                            show.isLive
                              ? "glass-card border-primary/70 bg-primary/20 relative overflow-hidden glow-primary shadow-primary/20"
                              : "glass-card border-white/10"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono text-on-surface-variant">{show.time}</span>
                            {show.isLive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-primary">
                              {show.title}
                            </h4>
                            <p className="text-[10px] text-on-surface-variant mt-0.5">{show.host}</p>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {show.tags.map(tag => (
                              <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-primary/20 rounded-full text-primary font-semibold truncate">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* MOBILE SINGLE SELECTED DAY LAYOUT */}
              <div className="md:hidden w-full flex flex-col gap-4">
                <div className="font-headline text-base font-bold text-primary border-b border-white/15 pb-2">
                  {(isGreek ? WEEKLY_SCHEDULE_GR : WEEKLY_SCHEDULE_EN)[selectedMobileDay].fullName}
                </div>
                <div className="flex flex-col gap-3">
                  {(isGreek ? WEEKLY_SCHEDULE_GR : WEEKLY_SCHEDULE_EN)[selectedMobileDay].shows.map((show) => (
                    <div
                      key={show.id}
                      className={`p-4 rounded-2xl border flex justify-between items-center transition-all duration-200 shadow-md ${
                        show.isLive
                          ? "glass-card border-primary/70 bg-primary/20 glow-primary"
                          : "glass-card border-white/10"
                      }`}
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-on-surface-variant/85 bg-white/[0.06] px-2 py-0.5 rounded">
                            {show.time}
                          </span>
                          {show.isLive && (
                            <span className="flex items-center gap-1 text-[9px] text-primary font-bold bg-primary/20 px-2 py-0.5 rounded-full uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                              <span>{currentT.liveIndicator}</span>
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-primary">{show.title}</h4>
                        <p className="text-xs text-on-surface-variant">{show.host}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {show.tags.map(tag => (
                          <span key={tag} className="text-[9px] px-2.5 py-1 bg-primary/20 rounded-full text-primary font-semibold">
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
                                <span key={tag} className="text-[10px] bg-primary/20 text-primary px-3 py-0.5 rounded-full font-bold">
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
                              <span key={tag} className="text-[10px] bg-primary/20 text-primary px-2.5 py-0.5 rounded-full font-semibold">
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

                {/* SEARCH AND CAPABILITY FILTER Row */}
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xl justify-center items-center mt-3">
                  <div className="relative w-full sm:flex-grow">
                    <Search className="w-4 h-4 text-primary absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={archiveSearch}
                      onChange={(e) => setArchiveSearch(e.target.value)}
                      placeholder={currentT.searchPlaceholder}
                      className="w-full glass-pill rounded-full py-2.5 pl-11 pr-4 text-sm text-on-surface focus:outline-none focus:border-primary placeholder:text-on-surface-variant/50 transition-all shadow-inner"
                    />
                  </div>
                  <select
                    value={archiveFilter}
                    onChange={(e) => setArchiveFilter(e.target.value)}
                    className="glass-pill rounded-full py-2.5 px-5 text-sm text-on-surface focus:outline-none focus:border-primary appearance-none cursor-pointer font-semibold shadow-xs"
                  >
                    <option value="newest" className="bg-background text-on-surface">{currentT.sortNewest}</option>
                    <option value="popular" className="bg-background text-on-surface">{currentT.sortPopular}</option>
                  </select>
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
                            <span key={tag} className="bg-primary/30 text-primary text-[10px] px-2.5 py-0.5 rounded-full font-bold backdrop-blur-md shadow-xs border border-primary/20">
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
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="w-full py-12 flex flex-col items-center gap-4 px-6 relative z-10 mt-auto border-t border-outline-variant/10 bg-transparent">
        <div className="font-headline text-lg font-bold text-primary/50 tracking-tighter">
          FRS
        </div>
        <ul className="flex gap-6 text-xs text-on-surface-variant/60 font-semibold">
          <li><a href="#" className="hover:text-primary transition-all">Instagram</a></li>
          <li><a href="#" className="hover:text-primary transition-all">Mixcloud</a></li>
          <li><a href="#" className="hover:text-primary transition-all">Contact</a></li>
          <li><a href="#" className="hover:text-primary transition-all">Privacy</a></li>
        </ul>
        <div className="text-[10px] text-on-surface-variant/40 mt-1">
          © {new Date().getFullYear()} Foititika Radio Show. Built for students, by students.
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
          className="fixed bottom-[145px] md:bottom-[88px] right-6 z-[55] w-14 h-14 bg-[#c1cc94] text-[#181b11] rounded-full shadow-[0_15px_35px_rgba(193,204,148,0.45)] hover:shadow-[0_20px_45px_rgba(193,204,148,0.65)] flex items-center justify-center cursor-pointer border border-white/40"
          title={isGreek ? "Άνοιγμα Συνομιλίας" : "Open Chat"}
        >
          <MessageSquare className="w-6 h-6 text-[#181b11] fill-[#181b11]" />
        </motion.button>
      )}

      {/* BOTTOM NAVIGATION NAV-BAR (Mobile view matches screen mock references) */}
      <nav className="fixed bottom-0 left-0 w-full z-45 flex justify-around items-center px-4 py-3 md:hidden glass-navbar rounded-t-3xl border-t border-white/15 pb-7 shadow-[0_-10px_30px_rgba(0,0,0,0.6)]">
        <button 
          onClick={() => { handleTabChange("home"); }}
          className={`flex flex-col items-center justify-center p-2 rounded-full transition-all cursor-pointer ${
            activeTab === "home" ? "text-primary scale-110 drop-shadow-[0_0_8px_rgba(193,204,148,0.6)]" : "text-on-surface-variant"
          }`}
        >
          <Radio className="w-5 h-5" />
        </button>
        <button 
          onClick={() => { handleTabChange("program"); }}
          className={`flex flex-col items-center justify-center p-2 rounded-full transition-all cursor-pointer ${
            activeTab === "program" ? "text-primary scale-110 drop-shadow-[0_0_8px_rgba(193,204,148,0.6)]" : "text-on-surface-variant"
          }`}
        >
          <Calendar className="w-5 h-5" />
        </button>
        <button 
          onClick={() => { handleTabChange("descriptions"); }}
          className={`flex flex-col items-center justify-center p-2 rounded-full transition-all cursor-pointer ${
            activeTab === "descriptions" ? "text-primary scale-110 drop-shadow-[0_0_8px_rgba(193,204,148,0.6)]" : "text-on-surface-variant"
          }`}
        >
          <Mic className="w-5 h-5" />
        </button>
        <button 
          onClick={() => { handleTabChange("archive"); }}
          className={`flex flex-col items-center justify-center p-2 rounded-full transition-all cursor-pointer ${
            activeTab === "archive" ? "text-primary scale-110 drop-shadow-[0_0_8px_rgba(193,204,148,0.6)]" : "text-on-surface-variant"
          }`}
        >
          <Music className="w-5 h-5" />
        </button>
      </nav>

      {/* INTEGRATED SLIDING SIDEBAR CHAT PANEL */}
      <LiveChat 
        isGreek={isGreek} 
        isOpen={chatOpen} 
        onClose={() => setChatOpen(false)} 
        onActiveTrackTrigger={handleTuneChannel}
      />

      {/* PERSISTENT LIVE AUDIO STREAM CONTROLLER */}
      <MainPlayer 
        isGreek={isGreek} 
        stationPlaying={stationPlaying} 
        setStationPlaying={setStationPlaying} 
        activeTrackId={activeTrackId}
      />

    </div>
  );
}
