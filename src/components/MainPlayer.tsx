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
  currentLiveShow?: any;
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

export default function MainPlayer({ isGreek, stationPlaying, setStationPlaying, activeTrackId, currentLiveShow }: MainPlayerProps) {
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

  // Dynamically compute display details (title, host, genre) when listening to the main FRS channel
  const displayChannel = React.useMemo(() => {
    if (currentChannelIndex === 0 && !activeChannel.isCustom) {
      if (currentLiveShow) {
        return {
          ...activeChannel,
          name: currentLiveShow.title,
          dj: currentLiveShow.host,
          genre: `${currentLiveShow.time} • FRS UTH Live`
        };
      } else {
        return {
          ...activeChannel,
          name: isGreek ? "Αυτόματη Ροή FRS UTH 24/7" : "FRS UTH 24/7 Automated Stream",
          dj: isGreek ? "Μουσική Επιλογή 24/7" : "24/7 Curated Tracks",
          genre: "Non-Stop Music Rotation"
        };
      }
    }
    return activeChannel;
  }, [activeChannel, currentChannelIndex, currentLiveShow, isGreek]);

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
              <Disc className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            {stationPlaying && audioStatus === "playing" && !isMuted && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary border-2 border-background" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="inline-block px-2.5 py-0.5 text-[9px] md:text-[10px] text-white bg-primary font-bold tracking-widest rounded-full uppercase shadow-xs">
                {audioStatus === "connecting" ? (isGreek ? "ΣΥΝΔΕΣΗ..." : "CONNECTING...") : "ON AIR"}
              </span>

              {/* Animated Equalizer Bars when playing */}
              {stationPlaying && audioStatus === "playing" && !isMuted && (
                <div className="flex items-end gap-0.5 h-3 px-1">
                  <span className="w-1 bg-primary rounded-t animate-[bounce_0.6s_infinite_0.1s] h-full" />
                  <span className="w-1 bg-primary rounded-t animate-[bounce_0.6s_infinite_0.3s] h-2/3" />
                  <span className="w-1 bg-primary rounded-t animate-[bounce_0.6s_infinite_0.2s] h-full" />
                  <span className="w-1 bg-primary rounded-t animate-[bounce_0.6s_infinite_0.4s] h-1/2" />
                </div>
              )}

              <span className="text-xs text-on-surface-variant font-semibold truncate hidden sm:inline">
                {displayChannel.dj}
              </span>
            </div>

            <h4 className="font-headline text-xs md:text-sm font-bold text-white truncate mt-0.5">
              {displayChannel.name}
            </h4>
            <p className="text-[10px] md:text-[11px] text-on-surface-variant/80 truncate font-mono">
              {displayChannel.genre}
            </p>
          </div>
        </div>

        {/* Center Section: Play / Pause Controls & Status - ABSOLUTE CENTERED SO IT IS NEVER OFF-CENTER */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20">
          {audioStatus === "error" ? (
            <button
              onClick={handleRetryStream}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-error text-on-error text-xs font-bold hover:brightness-110 transition-all shadow-md cursor-pointer animate-pulse"
              title={isGreek ? "Σφάλμα Ροής - Κλικ για Επανασύνδεση" : "Stream Error - Click to Retry"}
            >
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">{isGreek ? "Επανασύνδεση" : "Retry Stream"}</span>
            </button>
          ) : (
            <button
              onClick={togglePlay}
              id="control-play-pause"
              className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary text-white hover:brightness-110 active:scale-95 transition-all duration-200 cursor-pointer shadow-lg shadow-primary/30 flex items-center justify-center border border-white/20 group"
            >
              {audioStatus === "connecting" ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : stationPlaying ? (
                <Pause className="w-7 h-7 text-white fill-white" />
              ) : (
                <Play className="w-7 h-7 text-white fill-white ml-0.5" />
              )}
            </button>
          )}
        </div>

        {/* Right Section: Volume Controls */}
        <div className="flex items-center gap-3 justify-end max-w-[42%] md:max-w-[38%] z-10 ml-auto">
          {/* Volume Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-on-surface-variant hover:text-primary transition-colors p-1 cursor-pointer"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-error" /> : <Volume2 className="w-4 h-4 text-primary" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 md:w-24 accent-primary bg-surface-container-highest rounded-lg appearance-auto h-1.5 cursor-pointer"
            />
          </div>
        </div>
      </motion.div>
    </>
  );
}
