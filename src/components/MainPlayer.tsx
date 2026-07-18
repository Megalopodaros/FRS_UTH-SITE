/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, Radio, Music, Disc, Settings, CheckCircle2, AlertCircle, RefreshCw, X, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RadioChannel } from "../types";

interface MainPlayerProps {
  isGreek: boolean;
  stationPlaying: boolean;
  setStationPlaying: (playing: boolean) => void;
  activeTrackId?: string;
}

// Default high-reliability 24/7 live electronic, ambient, and indie streams
const DEFAULT_CHANNELS: RadioChannel[] = [
  {
    id: "techno",
    name: "Electric Avenue (24/7 Live)",
    greekName: "Λεωφόρος Ηλεκτρονικής (24/7 Live)",
    dj: "DJ Nova",
    genre: "Techno / Electronic",
    url: "https://ice1.somafm.com/groovesalad-128-mp3"
  },
  {
    id: "ambient",
    name: "Deep Space (24/7 Live)",
    greekName: "Βαθύ Διάστημα (24/7 Live)",
    dj: "The Cosmonaut",
    genre: "Ambient / Space Beats",
    url: "https://ice1.somafm.com/deepspaceone-128-mp3"
  },
  {
    id: "lofi",
    name: "Morning Mix (24/7 Live)",
    greekName: "Πρωινό Μείγμα (24/7 Live)",
    dj: "DJ Apollo",
    genre: "Indie Pop / Chill",
    url: "https://ice1.somafm.com/indiepop-128-mp3"
  },
  {
    id: "underground",
    name: "Underground Beats (24/7 Live)",
    greekName: "Underground Ρυθμοί (24/7 Live)",
    dj: "Campus Resident",
    genre: "Drum & Bass / Synthwave",
    url: "https://ice1.somafm.com/defcon-128-mp3"
  }
];

const STREAM_URL_KEY = "frs_custom_stream_url";
const STREAM_NAME_KEY = "frs_custom_station_name";

export default function MainPlayer({ isGreek, stationPlaying, setStationPlaying, activeTrackId }: MainPlayerProps) {
  const [currentChannelIndex, setCurrentChannelIndex] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  
  // Custom Radio.co / stream configuration
  const [customUrl, setCustomUrl] = useState("");
  const [customName, setCustomName] = useState("");
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Stream status tracking
  const [audioStatus, setAudioStatus] = useState<"idle" | "connecting" | "playing" | "error">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize custom stream from localStorage on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem(STREAM_URL_KEY);
    const savedName = localStorage.getItem(STREAM_NAME_KEY);
    if (savedUrl) {
      setCustomUrl(savedUrl);
    }
    if (savedName) {
      setCustomName(savedName);
    }
  }, []);

  // Build combined channels list (if custom URL is set, place it at the front)
  const allChannels: RadioChannel[] = React.useMemo(() => {
    if (customUrl && customUrl.trim() !== "") {
      const name = customName.trim() || (isGreek ? "Ροή Radio.co / Custom" : "Radio.co Live Broadcast");
      return [
        {
          id: "custom",
          name: name,
          greekName: name,
          dj: "Radio.co Live",
          genre: "Live MP3 Stream",
          url: customUrl.trim(),
          isCustom: true
        },
        ...DEFAULT_CHANNELS
      ];
    }
    return DEFAULT_CHANNELS;
  }, [customUrl, customName, isGreek]);

  // Ensure currentChannelIndex remains valid
  const activeChannel = allChannels[currentChannelIndex] || allChannels[0];

  // Sync index from activeTrackId (when clicked from schedule/cards)
  useEffect(() => {
    if (activeTrackId) {
      const idx = allChannels.findIndex(c => {
        if (activeTrackId.includes("m3") || activeTrackId.includes("arc1") || activeTrackId.includes("desc4")) return c.id === "techno";
        if (activeTrackId.includes("m4") || activeTrackId.includes("arc2") || activeTrackId.includes("desc1")) return c.id === "ambient";
        if (activeTrackId.includes("m1") || activeTrackId.includes("desc5")) return c.id === "lofi";
        return false;
      });
      if (idx !== -1) {
        setCurrentChannelIndex(idx);
        setStationPlaying(true);
      }
    }
  }, [activeTrackId, allChannels]);

  // Handle audio lifecycle & stream switching
  useEffect(() => {
    // Cleanup previous audio object
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }

    if (!stationPlaying) {
      setAudioStatus("idle");
      return;
    }

    setAudioStatus("connecting");
    const audio = new Audio();
    audioRef.current = audio;

    // Set up listeners before setting src
    const handlePlaying = () => setAudioStatus("playing");
    const handleWaiting = () => setAudioStatus("connecting");
    const handleError = () => {
      console.warn("Audio playback error for URL:", activeChannel.url);
      setAudioStatus("error");
    };

    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("error", handleError);

    audio.src = activeChannel.url;
    audio.volume = isMuted ? 0 : volume;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("Autoplay / Audio play blocked:", err);
        setAudioStatus("error");
      });
    }

    return () => {
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audio.src = "";
    };
  }, [currentChannelIndex, stationPlaying, activeChannel.url]);

  // Handle Volume & Mute dynamically
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    setStationPlaying(!stationPlaying);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const switchChannel = (idx: number) => {
    setCurrentChannelIndex(idx);
    setStationPlaying(true);
  };

  const handleRetryStream = () => {
    if (audioRef.current) {
      setAudioStatus("connecting");
      audioRef.current.src = activeChannel.url;
      audioRef.current.play().catch(() => setAudioStatus("error"));
    } else {
      setStationPlaying(false);
      setTimeout(() => setStationPlaying(true), 100);
    }
  };

  const handleSaveCustomStream = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(STREAM_URL_KEY, customUrl.trim());
    localStorage.setItem(STREAM_NAME_KEY, customName.trim());
    
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsSetupOpen(false);
      setCurrentChannelIndex(0); // Select the newly saved stream
      setStationPlaying(true);
    }, 900);
  };

  const handleClearCustomStream = () => {
    localStorage.removeItem(STREAM_URL_KEY);
    localStorage.removeItem(STREAM_NAME_KEY);
    setCustomUrl("");
    setCustomName("");
    setCurrentChannelIndex(0);
  };

  return (
    <>
      {/* PERSISTENT BOTTOM PLAYER BAR */}
      <motion.div
        id="persistent-player"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 140, damping: 22 }}
        className="fixed bottom-[64px] md:bottom-0 left-0 right-0 w-full h-[80px] md:h-[84px] glass-player z-[50] px-4 md:px-12 flex items-center justify-between transition-all duration-300"
      >
        {/* Left Section: Active Show / Station Info & Visualizer */}
        <div className="flex items-center gap-3.5 max-w-[42%] md:max-w-[38%] min-w-0 z-10">
          <div className="relative flex-shrink-0">
            <div
              className={`w-11 h-11 md:w-13 md:h-13 rounded-2xl bg-white/5 border border-white/12 flex items-center justify-center overflow-hidden shadow-lg shadow-black/60 ${
                stationPlaying && audioStatus === "playing" ? "animate-spin [animation-duration:8s]" : ""
              }`}
            >
              <Disc className="w-5 h-5 md:w-6 md:h-6 text-[#c1cc94] drop-shadow-[0_0_8px_rgba(193,204,148,0.7)]" />
            </div>
            {stationPlaying && audioStatus === "playing" && !isMuted && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c1cc94] opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#c1cc94] border-2 border-[#000000]" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="inline-block px-2 py-0.5 text-[9px] md:text-[10px] text-[#181b11] bg-[#c1cc94] font-black tracking-widest rounded uppercase shadow-[0_0_12px_rgba(193,204,148,0.4)]">
                {audioStatus === "connecting" ? (isGreek ? "ΣΥΝΔΕΣΗ..." : "CONNECTING...") : "ON AIR"}
              </span>

              {/* Animated Equalizer Bars when playing */}
              {stationPlaying && audioStatus === "playing" && !isMuted && (
                <div className="flex items-end gap-0.5 h-3 px-1">
                  <span className="w-1 bg-[#c1cc94] rounded-t animate-[bounce_0.6s_infinite_0.1s] h-full shadow-[0_0_6px_rgba(193,204,148,0.6)]" />
                  <span className="w-1 bg-[#c1cc94] rounded-t animate-[bounce_0.6s_infinite_0.3s] h-2/3 shadow-[0_0_6px_rgba(193,204,148,0.6)]" />
                  <span className="w-1 bg-[#c1cc94] rounded-t animate-[bounce_0.6s_infinite_0.2s] h-full shadow-[0_0_6px_rgba(193,204,148,0.6)]" />
                  <span className="w-1 bg-[#c1cc94] rounded-t animate-[bounce_0.6s_infinite_0.4s] h-1/2 shadow-[0_0_6px_rgba(193,204,148,0.6)]" />
                </div>
              )}

              <span className="text-xs text-on-surface-variant font-semibold truncate hidden sm:inline">
                {activeChannel.dj}
              </span>
            </div>

            <h4 className="font-headline text-xs md:text-sm font-bold text-white truncate mt-0.5">
              {isGreek ? activeChannel.greekName : activeChannel.name}
            </h4>
            <p className="text-[10px] md:text-[11px] text-on-surface-variant/80 truncate font-mono">
              {activeChannel.genre}
            </p>
          </div>
        </div>

        {/* Center Section: Play / Pause Controls & Status - ABSOLUTE CENTERED SO IT IS NEVER OFF-CENTER */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20">
          {audioStatus === "error" ? (
            <button
              onClick={handleRetryStream}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-error text-on-error text-xs font-bold hover:brightness-110 transition-all shadow-md cursor-pointer animate-pulse"
              title={isGreek ? "Σφάλμα Ροής - Κλικ για Επανασύνδεση" : "Stream Error - Click to Retry"}
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span className="hidden sm:inline">{isGreek ? "Επανασύνδεση" : "Retry Stream"}</span>
            </button>
          ) : (
            <button
              onClick={togglePlay}
              id="control-play-pause"
              className="w-13 h-13 md:w-15 md:h-15 rounded-full bg-gradient-to-b from-white/25 to-white/5 p-[1px] flex items-center justify-center hover:scale-106 active:scale-95 transition-all duration-300 cursor-pointer shadow-[0_12px_32px_rgba(0,0,0,0.8),_0_0_30px_rgba(193,204,148,0.3)] group"
            >
              <div className="w-full h-full rounded-full bg-[#141417]/90 backdrop-blur-3xl group-hover:bg-[#1c1c21]/95 flex items-center justify-center transition-colors border border-white/10">
                {audioStatus === "connecting" ? (
                  <div className="w-6 h-6 border-2 border-[#c1cc94] border-t-transparent rounded-full animate-spin" />
                ) : stationPlaying ? (
                  <Pause className="w-6 h-6 md:w-7 md:h-7 text-[#c1cc94] fill-[#c1cc94] drop-shadow-[0_0_12px_rgba(193,204,148,0.7)]" />
                ) : (
                  <Play className="w-6 h-6 md:w-7 md:h-7 text-[#c1cc94] fill-[#c1cc94] drop-shadow-[0_0_12px_rgba(193,204,148,0.7)] ml-0.5" />
                )}
              </div>
            </button>
          )}
        </div>

        {/* Right Section: Volume Controls */}
        <div className="flex items-center gap-3 justify-end max-w-[42%] md:max-w-[38%] z-10 ml-auto">
          {/* Volume Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-on-surface-variant hover:text-[#c1cc94] transition-colors p-1 cursor-pointer"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-error" /> : <Volume2 className="w-4 h-4 text-[#c1cc94]" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 md:w-24 accent-[#c1cc94] bg-surface-container-highest rounded-lg appearance-auto h-1.5 cursor-pointer"
            />
          </div>
        </div>
      </motion.div>
    </>
  );
}
