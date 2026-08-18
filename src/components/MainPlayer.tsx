/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import { Play, Pause, Volume, Volume1, Volume2, VolumeX, Share2, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RadioChannel } from "../types";

interface MainPlayerProps {
  isGreek: boolean;
  stationPlaying: boolean;
  setStationPlaying: (playing: boolean | ((prev: boolean) => boolean)) => void;
  isLoadingAudio?: boolean;
  setIsLoadingAudio?: (loading: boolean) => void;
  activeTrackId?: string;
  currentLiveShow?: any;
  onOpenChat?: () => void;
  volume: number;
  setVolume: (v: number) => void;
  isMuted: boolean;
  setIsMuted: (m: boolean) => void;
  className?: string;
}

// Single 24/7 universal live MP3 radio stream for FRS UTH
const UNIVERSAL_CHANNEL: RadioChannel = {
  id: "coderadio",
  name: "Αυτόματη Ροή FRS UTH",
  greekName: "Αυτόματη Ροή FRS UTH",
  dj: "Non-Stop Campus Radio Rotation",
  genre: "High Quality 320kbps Stream",
  url: "https://peridot.streamguys1.com:7830/WUCF"
};

// Rhythmic Chill Beats Web Audio API Synthesizer fallback
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

        // Kick drum
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

        // Snare Rim
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

        // Rhodes Chords
        currentChord.forEach((freq) => {
          if (!this.ctx || !this.masterGain) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.04, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start(now);
          osc.stop(now + 0.48);
        });

        beatStep = (beatStep + 1) % 16;
      };

      this.timer = setInterval(playChillBeatStep, 450);
    } catch (e) {
      console.warn("Web Audio Synth could not initialize:", e);
    }
  }

  setVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(vol * 0.4, this.ctx.currentTime);
    }
  }

  stop() {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (e) {}
      this.ctx = null;
      this.masterGain = null;
    }
  }
}

const synthEngine = new ChillBeatsWebAudioSynth();

export default function MainPlayer({
  isGreek,
  stationPlaying,
  setStationPlaying,
  isLoadingAudio = false,
  setIsLoadingAudio,
  currentLiveShow,
  volume,
  setVolume,
  isMuted,
  setIsMuted,
  className = ""
}: MainPlayerProps) {
  const [copiedShare, setCopiedShare] = React.useState(false);
  const [, setTick] = React.useState(Date.now());

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Timer ticker every second for live show progress
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format seconds to MM:SS or HH:MM:SS
  const formatTime = (secs: number) => {
    const totalSecs = Math.max(0, Math.floor(secs));
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const remainder = totalSecs % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  // Calculate live show progress based on exact broadcast slot time
  const showProgress = React.useMemo(() => {
    const now = new Date();
    if (currentLiveShow && currentLiveShow.time) {
      const parts = currentLiveShow.time.split("-").map((s: string) => s.trim());
      if (parts.length === 2) {
        const [startH, startM] = parts[0].split(":").map(Number);
        const [endH, endM] = parts[1].split(":").map(Number);
        let startSec = (startH * 60 + startM) * 60;
        let endSec = (endH * 60 + endM) * 60;
        if (endSec <= startSec) endSec += 24 * 3600;

        const nowSec = (now.getHours() * 60 + now.getMinutes()) * 60 + now.getSeconds();
        const elapsed = Math.max(0, nowSec - startSec);
        const total = Math.max(1, endSec - startSec);
        const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));

        return {
          percent: pct,
          elapsedStr: formatTime(elapsed),
          totalStr: formatTime(total)
        };
      }
    }

    // Default hourly stream progression
    const nowSecInHour = now.getMinutes() * 60 + now.getSeconds();
    const totalHourSec = 3600;
    const pct = (nowSecInHour / totalHourSec) * 100;

    return {
      percent: pct,
      elapsedStr: formatTime(nowSecInHour),
      totalStr: "60:00"
    };
  }, [currentLiveShow, isGreek]);

  // Dynamically compute display title and description
  const displayTitle = currentLiveShow?.title || (isGreek ? UNIVERSAL_CHANNEL.greekName : UNIVERSAL_CHANNEL.name);
  const displaySubtitle = currentLiveShow 
    ? `${currentLiveShow.host} • ${currentLiveShow.time}` 
    : (isGreek ? "Non-Stop Campus Radio Rotation" : "Non-Stop Campus Radio Rotation");

  // Audio lifecycle
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "none";
      audioRef.current.crossOrigin = "anonymous";
    }

    const audio = audioRef.current;

    const handlePlaying = () => {
      setIsLoadingAudio?.(false);
      synthEngine.stop();
    };

    const handleWaiting = () => {
      if (stationPlaying) {
        setIsLoadingAudio?.(true);
      }
    };

    const handleCanPlay = () => {
      setIsLoadingAudio?.(false);
    };

    const handlePause = () => {
      setIsLoadingAudio?.(false);
    };

    const handleError = (e: any) => {
      setIsLoadingAudio?.(false);
      console.warn("Audio stream fallback notice:", e);
      if (stationPlaying) {
        synthEngine.start(isMuted ? 0 : volume);
      }
    };

    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("error", handleError);
    };
  }, [isMuted, volume, stationPlaying, setIsLoadingAudio]);

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (stationPlaying) {
      setIsLoadingAudio?.(true);
      if (audio.src !== UNIVERSAL_CHANNEL.url) {
        audio.src = UNIVERSAL_CHANNEL.url;
        audio.load();
      }
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsLoadingAudio?.(false);
          })
          .catch((err) => {
            setIsLoadingAudio?.(false);
            console.warn("Autoplay / network policy fallback to synth:", err);
            synthEngine.start(isMuted ? 0 : volume);
          });
      }
    } else {
      setIsLoadingAudio?.(false);
      audio.pause();
      synthEngine.stop();
    }
  }, [stationPlaying, isMuted, volume, setIsLoadingAudio]);

  // Sync volume
  useEffect(() => {
    const effectiveVol = isMuted ? 0 : volume;
    if (audioRef.current) {
      audioRef.current.volume = effectiveVol;
    }
    synthEngine.setVolume(effectiveVol);
  }, [volume, isMuted]);

  // Copy site link to clipboard
  const handleShare = async () => {
    try {
      const siteUrl = window.location.origin + window.location.pathname;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(siteUrl);
      } else {
        const tempInput = document.createElement("input");
        tempInput.value = siteUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
      }
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    } catch (err) {
      console.warn("Clipboard copy notice:", err);
    }
  };

  const effectiveVolPercent = isMuted ? 0 : volume * 100;

  return (
    <div className={`w-full ${className}`}>
      {/* UNIFIED STUDIO HERO IMAGE + LIVE PLAYER IN ONE SINGLE BOX */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl border border-white/90 flex flex-col transition-all">
        
        {/* Top Portion: Studio Photo with Live Now Overlay */}
        <div className="relative aspect-[16/10] sm:aspect-[16/9] md:aspect-[4/3] bg-stone-900 overflow-hidden group">
          <img
            src="/hero-studio.jpg"
            alt="FRS UTH Radio Broadcast Studio"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          {/* Smooth bottom gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

          {/* Bottom Overlay on Image: Show Title & Producer */}
          <div className="absolute bottom-3.5 left-3.5 right-3.5 sm:bottom-4 sm:left-4 sm:right-4 text-white">
            <h4 className="font-display text-xl sm:text-2xl lg:text-3xl font-black leading-tight drop-shadow-sm truncate tracking-tight">
              {displayTitle}
            </h4>
            <p className="font-sans text-xs sm:text-sm text-stone-300 mt-1 truncate font-semibold">
              {displaySubtitle}
            </p>
          </div>
        </div>

        {/* Bottom Portion: Live Player Controls inside the SAME box */}
        <div className="p-4 sm:p-5 bg-white md:bg-white/75 md:backdrop-blur-md flex flex-col gap-3.5 border-t border-black/[0.05]">
          
          {/* Row 1: Play/Pause Button + Live Progress Bar & Elapsed Time */}
          <div className="flex items-center gap-3 sm:gap-4 w-full">
            {/* Play/Pause Button */}
            <button
              onClick={() => {
                if (!stationPlaying) {
                  setIsLoadingAudio?.(true);
                  setStationPlaying(true);
                } else {
                  setStationPlaying(false);
                  setIsLoadingAudio?.(false);
                }
              }}
              aria-label={stationPlaying ? "Pause stream" : "Play live radio"}
              className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#1C1917] text-white flex items-center justify-center shrink-0 hover:bg-black transition-transform active:scale-95 cursor-pointer shadow-md group"
            >
              {isLoadingAudio ? (
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-spin" />
              ) : stationPlaying ? (
                <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-white text-white" />
              ) : (
                <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white text-white ml-0.5" />
              )}
              {/* Red dot indicator on player button */}
              {stationPlaying && !isLoadingAudio && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DF3B2B] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#DF3B2B] border-2 border-white"></span>
                </span>
              )}
            </button>

            {/* Live Progress Bar & Timers */}
            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
              <div className="flex items-center justify-between text-xs font-grotesk text-[#78716C]">
                <span className="font-bold tracking-wide">{showProgress.elapsedStr}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${stationPlaying ? "bg-[#DF3B2B] animate-pulse" : "bg-[#78716C]"}`} />
                  <span className="font-display text-[11px] font-black text-[#DF3B2B] tracking-wider">LIVE</span>
                </div>
              </div>

              {/* Dynamic Progress Bar */}
              <div className="relative w-full h-2.5 bg-[#EFECE3] rounded-full overflow-hidden flex items-center">
                <div 
                  className="h-full bg-[#DF3B2B] rounded-full transition-all duration-500 ease-linear"
                  style={{ width: `${Math.max(4, showProgress.percent)}%` }}
                />
                {stationPlaying && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Red Volume Slider & Share Button */}
          <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-black/[0.06]">
            
            {/* Volume Control */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-[#78716C] hover:text-[#DF3B2B] transition-colors cursor-pointer p-1"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-[#DF3B2B]" />
                ) : volume < 0.4 ? (
                  <Volume className="w-4 h-4 text-[#DF3B2B]" />
                ) : volume < 0.75 ? (
                  <Volume1 className="w-4 h-4 text-[#DF3B2B]" />
                ) : (
                  <Volume2 className="w-4 h-4 text-[#DF3B2B]" />
                )}
              </button>

              {/* Custom styled Red Track Volume Slider */}
              <div className="relative flex items-center">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    if (isMuted) setIsMuted(false);
                  }}
                  style={{
                    background: `linear-gradient(to right, #DF3B2B 0%, #DF3B2B ${effectiveVolPercent}%, #EFECE3 ${effectiveVolPercent}%, #EFECE3 100%)`
                  }}
                  className="w-24 sm:w-32 h-2 rounded-lg appearance-none cursor-pointer accent-[#1C1917] transition-all"
                  aria-label="Volume slider"
                />
              </div>
            </div>

            {/* Share Button (Copies Site Link) */}
            <div className="relative flex items-center">
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#78716C] hover:text-[#1C1917] px-3 py-1.5 rounded-full hover:bg-[#FAF8F4] border border-black/5 transition-colors cursor-pointer"
                title={isGreek ? "Αντιγραφή συνδέσμου ιστοσελίδας" : "Copy site link"}
              >
                {copiedShare ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
                ) : (
                  <Share2 className="w-3.5 h-3.5 text-[#78716C]" />
                )}
                <span>{copiedShare ? (isGreek ? "Αντιγράφηκε" : "Copied") : (isGreek ? "Κοινοποίηση" : "Share")}</span>
              </button>

              {/* Tooltip feedback for copy */}
              <AnimatePresence>
                {copiedShare && (
                  <motion.span
                    initial={{ opacity: 0, y: 5, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.9 }}
                    className="absolute -top-8 right-0 bg-[#1C1917] text-white text-[10px] font-bold py-1 px-2.5 rounded-full whitespace-nowrap shadow-lg pointer-events-none"
                  >
                    {isGreek ? "Αντιγράφηκε!" : "Link Copied!"}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
