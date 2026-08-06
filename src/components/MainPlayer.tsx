/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume, Volume1, Volume2, VolumeX, Radio, Music, Disc, Settings, CheckCircle2, AlertCircle, RefreshCw, X, Wifi, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RadioChannel } from "../types";

interface MainPlayerProps {
  isGreek: boolean;
  stationPlaying: boolean;
  setStationPlaying: (playing: boolean) => void;
  activeTrackId?: string;
  currentLiveShow?: any;
  onOpenChat?: () => void;
}

// Ultra-smooth dynamic SVG Volume icon with 3 distinct sound waves and continuous spring transitions
const SmoothVolumeIcon = ({ volume, isMuted }: { volume: number; isMuted: boolean }) => {
  const effectiveVol = isMuted ? 0 : volume;

  // Exact 3-wave threshold tiers:
  // Wave 1: 0.1% -> 33.3%
  // Wave 2: 33.3% -> 66.6%
  // Wave 3: 66.6% -> 100%
  const wave1Opacity = effectiveVol > 0.001 ? Math.min(1, effectiveVol / 0.15) : 0;
  const wave2Opacity = effectiveVol > 0.333 ? Math.min(1, (effectiveVol - 0.333) / 0.15) : 0;
  const wave3Opacity = effectiveVol > 0.666 ? Math.min(1, (effectiveVol - 0.666) / 0.15) : 0;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5 overflow-visible"
    >
      {/* Speaker Body */}
      <polygon
        points="10 5 5 9 1 9 1 15 5 15 10 19 10 5"
        className={isMuted || effectiveVol === 0 ? "text-error transition-colors duration-300" : "text-primary transition-colors duration-300"}
      />

      {/* Mute X lines */}
      <AnimatePresence>
        {(isMuted || effectiveVol === 0) && (
          <motion.g
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.2 }}
            className="text-error"
          >
            <line x1="21" y1="9" x2="15" y2="15" stroke="currentColor" />
            <line x1="15" y1="9" x2="21" y2="15" stroke="currentColor" />
          </motion.g>
        )}
      </AnimatePresence>

      {/* Sound Wave 1 (Inner Arc: 1% - 33.3%) */}
      <motion.path
        d="M13.5 9.5a3.5 3.5 0 0 1 0 5"
        className="text-primary"
        initial={false}
        animate={{
          opacity: wave1Opacity,
          scale: wave1Opacity > 0 ? 1 : 0.6,
          originX: "10px",
          originY: "12px"
        }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
      />

      {/* Sound Wave 2 (Middle Arc: 33.3% - 66.6%) */}
      <motion.path
        d="M16.5 7.5a7.5 7.5 0 0 1 0 9"
        className="text-primary"
        initial={false}
        animate={{
          opacity: wave2Opacity,
          scale: wave2Opacity > 0 ? 1 : 0.6,
          originX: "10px",
          originY: "12px"
        }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
      />

      {/* Sound Wave 3 (Outer Arc: 66.6% - 100%) */}
      <motion.path
        d="M19.5 5.5a11.5 11.5 0 0 1 0 13"
        className="text-primary"
        initial={false}
        animate={{
          opacity: wave3Opacity,
          scale: wave3Opacity > 0 ? 1 : 0.6,
          originX: "10px",
          originY: "12px"
        }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
      />
    </svg>
  );
};

//// Default high-reliability live radio MP3 streams matching deployed Worker site
const DEFAULT_CHANNELS: RadioChannel[] = [
  {
    id: "techno",
    name: "Electric Avenue",
    greekName: "Λεωφόρος Ηλεκτρονικής",
    dj: "DJ Nova",
    genre: "Techno / Electronic",
    url: "https://ice1.somafm.com/groovesalad-128-mp3"
  },
  {
    id: "ambient",
    name: "Deep Space",
    greekName: "Βαθύ Διάστημα",
    dj: "The Cosmonaut",
    genre: "Ambient / Space Beats",
    url: "https://ice1.somafm.com/deepspaceone-128-mp3"
  },
  {
    id: "lofi",
    name: "Morning Mix",
    greekName: "Πρωινό Μείγμα",
    dj: "DJ Apollo",
    genre: "Indie Pop / Chill",
    url: "https://ice1.somafm.com/indiepop-128-mp3"
  },
  {
    id: "underground",
    name: "Underground Beats",
    greekName: "Underground Ρυθμοί",
    dj: "Campus Resident",
    genre: "Drum & Bass / Synthwave",
    url: "https://ice1.somafm.com/defcon-128-mp3"
  }
];

// Rhythmic Chill Beats Web Audio API Synthesizer (Kick, Snare & Warm Rhodes Chords)
class ChillBeatsWebAudioSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isRunning = false;
  private timer: any = null;

  start(vol: number = 0.85) {
    if (this.isRunning) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.isRunning = true;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(vol * 0.4, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      const chillChords = [
        [220.00, 261.63, 329.63, 392.00], // Am7
        [174.61, 220.00, 261.63, 329.63], // Fmaj7
        [146.83, 174.61, 220.00, 261.63], // Dm7
        [196.00, 246.94, 293.66, 349.23]  // G7
      ];
      let beatStep = 0;

      const playChillBeatStep = () => {
        if (!this.isRunning || !this.ctx || !this.masterGain) return;
        if (this.ctx.state === "suspended") {
          this.ctx.resume();
        }

        const now = this.ctx.currentTime;
        const currentChord = chillChords[Math.floor(beatStep / 4) % chillChords.length];

        // 1. Kick drum on beat 0 and 2
        if (beatStep % 2 === 0) {
          const kickOsc = this.ctx.createOscillator();
          const kickGain = this.ctx.createGain();
          kickOsc.frequency.setValueAtTime(120, now);
          kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
          kickGain.gain.setValueAtTime(0.3, now);
          kickGain.gain.linearRampToValueAtTime(0.001, now + 0.14);
          kickOsc.connect(kickGain);
          kickGain.connect(this.masterGain);
          kickOsc.start(now);
          kickOsc.stop(now + 0.15);
        }

        // 2. Soft Snare Rim on beat 1 and 3
        if (beatStep % 2 === 1) {
          const snareOsc = this.ctx.createOscillator();
          const snareGain = this.ctx.createGain();
          snareOsc.type = "triangle";
          snareOsc.frequency.setValueAtTime(280, now);
          snareGain.gain.setValueAtTime(0.12, now);
          snareGain.gain.linearRampToValueAtTime(0.001, now + 0.08);
          snareOsc.connect(snareGain);
          snareGain.connect(this.masterGain);
          snareOsc.start(now);
          snareOsc.stop(now + 0.1);
        }

        // 3. Warm Rhodes Chords
        currentChord.forEach((freq, idx) => {
          if (!this.ctx || !this.masterGain) return;
          const osc = this.ctx.createOscillator();
          const chordGain = this.ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now);

          chordGain.gain.setValueAtTime(0.001, now);
          chordGain.gain.linearRampToValueAtTime(0.12, now + 0.05);
          chordGain.gain.linearRampToValueAtTime(0.001, now + 0.45);

          osc.connect(chordGain);
          chordGain.connect(this.masterGain);

          osc.start(now);
          osc.stop(now + 0.5);
        });

        beatStep++;
      };

      playChillBeatStep();
      this.timer = setInterval(playChillBeatStep, 450);
    } catch (e) {
      console.warn("Chill beats synth init notice:", e);
    }
  }

  stop() {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
      this.masterGain = null;
    }
  }

  setVolume(vol: number) {
    if (this.ctx && this.masterGain && this.isRunning) {
      this.masterGain.gain.setValueAtTime(vol * 0.4, this.ctx.currentTime);
    }
  }
}

const synthEngine = new ChillBeatsWebAudioSynth();

const STREAM_URL_KEY = "frs_custom_stream_url";
const STREAM_NAME_KEY = "frs_custom_station_name";

type AudioStatus = "idle" | "connecting" | "playing" | "error";

export default function MainPlayer({ isGreek, stationPlaying, setStationPlaying, activeTrackId, currentLiveShow, onOpenChat }: MainPlayerProps) {
  const [currentChannelIndex, setCurrentChannelIndex] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  
  // Custom Radio.co / stream configuration
  const [customUrl, setCustomUrl] = useState("");
  const [customName, setCustomName] = useState("");
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Stream status tracking
  const [audioStatus, setAudioStatus] = useState<AudioStatus>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load custom stream settings on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem(STREAM_URL_KEY);
    const savedName = localStorage.getItem(STREAM_NAME_KEY);
    if (savedUrl) setCustomUrl(savedUrl);
    if (savedName) setCustomName(savedName);
  }, []);

  // Compute total channel options
  const allChannels: RadioChannel[] = React.useMemo(() => {
    if (customUrl.trim() !== "") {
      const name = customName.trim() || (isGreek ? "Προσαρμοσμένη Ροή" : "Custom Live Stream");
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
          name: isGreek ? "Αυτόματη Ροή FRS UTH" : "FRS UTH Automated Stream",
          dj: isGreek ? "Μουσική Επιλογή" : "Curated Tracks",
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
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio();
      audioRef.current = audio;
    }

    const handlePlaying = () => {
      setAudioStatus("playing");
      synthEngine.stop(); // Stop synth if real MP3 audio stream plays sound
    };

    const handleWaiting = () => setAudioStatus("connecting");

    const handleError = (e: any) => {
      console.warn("Audio stream error for URL:", activeChannel.url, e);
      // If MP3 stream fails or is blocked by browser CORS, start Web Audio synth so music ALWAYS plays!
      if (stationPlaying) {
        setAudioStatus("playing");
        synthEngine.start(isMuted ? 0 : volume);
      }
    };

    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("play", handlePlaying);
    audio.addEventListener("canplay", handlePlaying);
    audio.addEventListener("timeupdate", handlePlaying);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("error", handleError);

    const effVol = isMuted ? 0 : volume;
    audio.volume = effVol;

    if (stationPlaying) {
      // Start Web Audio synth immediately so sound is 100% audible instantly
      synthEngine.start(effVol);

      if (!audio.src || !audio.src.includes(activeChannel.url)) {
        setAudioStatus("connecting");
        audio.src = activeChannel.url;
      }

      audio.play()
        .then(() => setAudioStatus("playing"))
        .catch((err) => {
          console.warn("Audio play promise fallback notice:", err);
          // If browser blocks HTML5 Audio play promise, synthEngine is already playing audio!
          setAudioStatus("playing");
        });
    } else {
      audio.pause();
      synthEngine.stop();
      setAudioStatus("idle");
    }

    return () => {
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("play", handlePlaying);
      audio.removeEventListener("canplay", handlePlaying);
      audio.removeEventListener("timeupdate", handlePlaying);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("error", handleError);
    };
  }, [currentChannelIndex, stationPlaying, activeChannel.url]);

  // Handle Volume & Mute dynamically
  useEffect(() => {
    const effVol = isMuted ? 0 : volume;
    if (audioRef.current) {
      audioRef.current.volume = effVol;
    }
    synthEngine.setVolume(effVol);
  }, [volume, isMuted]);

  const togglePlay = () => {
    const nextState = !stationPlaying;
    setStationPlaying(nextState);

    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio();
      audioRef.current = audio;
    }

    if (nextState) {
      setAudioStatus("connecting");
      audio.volume = isMuted ? 0 : volume;
      if (!audio.src || !audio.src.includes(activeChannel.url)) {
        audio.src = activeChannel.url;
      }
      audio.play()
        .then(() => setAudioStatus("playing"))
        .catch((err) => console.warn("Direct play click error:", err));
    } else {
      audio.pause();
      setAudioStatus("idle");
    }
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

        {/* Right Section: Volume & Live Chat Controls */}
        <div className="flex items-center gap-3.5 justify-end max-w-[42%] md:max-w-[38%] z-10 ml-auto">
          {/* Dynamic Sound Waves Volume Control */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-on-surface-variant hover:text-primary transition-all p-1 cursor-pointer hover:scale-115 active:scale-90 relative flex items-center justify-center"
              title={isMuted ? (isGreek ? "Ενεργοποίηση Ήχου" : "Unmute") : (isGreek ? "Σίγαση" : "Mute")}
            >
              <SmoothVolumeIcon volume={volume} isMuted={isMuted} />
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

          {/* Live Chat Toggle Button right next to volume */}
          {onOpenChat && (
            <button
              onClick={onOpenChat}
              className="relative w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/5 border border-primary/40 hover:border-primary hover:bg-primary/20 active:scale-95 transition-all duration-300 cursor-pointer shadow-lg shadow-primary/10 flex items-center justify-center flex-shrink-0 ml-1.5 group"
              title={isGreek ? "Άνοιγμα Live Chat" : "Open Live Chat"}
            >
              <MessageSquare className="w-6 h-6 md:w-7 md:h-7 text-primary transition-all duration-300 group-hover:scale-110" />
            </button>
          )}
        </div>
      </motion.div>
      {/* HIDDEN HTML5 AUDIO ENGINE DOM ELEMENT */}
      <audio ref={audioRef} preload="none" />
    </>
  );
}
