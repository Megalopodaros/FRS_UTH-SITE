/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume, Volume1, Volume2, VolumeX, Share2, Check } from "lucide-react";
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

// Single 24/7 universal live MP3 radio stream for FRS UTH
const UNIVERSAL_CHANNEL: RadioChannel = {
  id: "coderadio",
  name: "Αυτόματη Ροή FRS UTH",
  greekName: "Αυτόματη Ροή FRS UTH",
  dj: "Non-Stop Campus Radio Rotation",
  genre: "High Quality 320kbps Stream",
  url: "https://peridot.streamguys1.com:7830/WUCF"
};

// Rhythmic Chill Beats Web Audio API Synthesizer (Kick, Snare & Warm Rhodes Chords fallback)
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

export default function MainPlayer({
  isGreek,
  stationPlaying,
  setStationPlaying,
  currentLiveShow
}: MainPlayerProps) {
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Timer for elapsed stream playback
  useEffect(() => {
    let interval: any = null;
    if (stationPlaying) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stationPlaying]);

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
      synthEngine.stop();
    };

    const handleError = (e: any) => {
      console.warn("Audio stream fallback notice:", e);
      if (stationPlaying) {
        synthEngine.start(isMuted ? 0 : volume);
      }
    };

    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("error", handleError);
    };
  }, [isMuted, volume, stationPlaying]);

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (stationPlaying) {
      if (audio.src !== UNIVERSAL_CHANNEL.url) {
        audio.src = UNIVERSAL_CHANNEL.url;
        audio.load();
      }
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Autoplay / network policy fallback to synth:", err);
          synthEngine.start(isMuted ? 0 : volume);
        });
      }
    } else {
      audio.pause();
      synthEngine.stop();
    }
  }, [stationPlaying]);

  // Sync volume
  useEffect(() => {
    const effectiveVol = isMuted ? 0 : volume;
    if (audioRef.current) {
      audioRef.current.volume = effectiveVol;
    }
    synthEngine.setVolume(effectiveVol);
  }, [volume, isMuted]);

  // Format elapsed time string
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

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
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6">
      <div className="bg-white rounded-2xl md:rounded-[22px] border border-black/[0.07] shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-3.5 sm:p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 transition-all">
        
        {/* Left: Big Dark Play Button + Metadata */}
        <div className="flex items-center gap-3.5 sm:gap-4 w-full md:w-auto">
          {/* Play/Pause Button */}
          <button
            onClick={() => setStationPlaying(!stationPlaying)}
            aria-label={stationPlaying ? "Pause stream" : "Play live radio"}
            className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#1C1917] text-white flex items-center justify-center shrink-0 hover:bg-black transition-transform active:scale-95 cursor-pointer shadow-md group"
          >
            {stationPlaying ? (
              <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-white text-white" />
            ) : (
              <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white text-white ml-0.5" />
            )}
            {/* Red dot indicator on player */}
            {stationPlaying && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DF3B2B] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#DF3B2B] border-2 border-white"></span>
              </span>
            )}
          </button>

          {/* Title & Status */}
          <div className="flex flex-col min-w-0 flex-1 md:flex-initial">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="bg-[#DF3B2B] text-white text-[10px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase">
                ON AIR
              </span>
              <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider">
                HIGH QUALITY 320KBPS
              </span>
            </div>
            <h3 className="font-bold text-sm sm:text-base text-[#1C1917] truncate leading-tight">
              {displayTitle}
            </h3>
            <p className="text-xs text-[#78716C] truncate mt-0.5 font-medium">
              {displaySubtitle}
            </p>
          </div>
        </div>

        {/* Center: Live Waveform / Progress bar & Timer */}
        <div className="flex items-center gap-3 w-full md:max-w-xs lg:max-w-md flex-1 px-1 sm:px-4">
          <span className="font-mono text-xs font-semibold text-[#78716C] shrink-0">
            {formatTime(elapsedSeconds)}
          </span>
          
          {/* Sleek Red Live Audio Bar */}
          <div className="relative flex-1 h-2 bg-[#EFECE3] rounded-full overflow-hidden flex items-center">
            <div 
              className={`h-full bg-[#DF3B2B] rounded-full transition-all duration-300 ${
                stationPlaying ? "w-full opacity-100" : "w-0 opacity-40"
              }`}
            />
            {stationPlaying && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            )}
          </div>

          {/* LIVE Tag */}
          <div className="flex items-center gap-1 shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${stationPlaying ? "bg-[#DF3B2B] animate-pulse" : "bg-[#78716C]"}`} />
            <span className="text-[11px] font-extrabold text-[#DF3B2B] tracking-wider">
              LIVE
            </span>
          </div>
        </div>

        {/* Right: Red Volume Slider & Share Button */}
        <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-5 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-black/[0.05]">
          {/* Red Volume Slider */}
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
                className="w-20 sm:w-24 h-2 rounded-lg appearance-none cursor-pointer accent-[#1C1917] transition-all"
                aria-label="Volume slider"
              />
            </div>
          </div>

          {/* Share Button (Copies Site Link) */}
          <div className="relative">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-[#78716C] hover:text-[#1C1917] p-2 rounded-full hover:bg-[#FAF8F4] transition-colors cursor-pointer"
              title={isGreek ? "Αντιγραφή συνδέσμου ιστοσελίδας" : "Copy site link"}
            >
              {copiedShare ? (
                <Check className="w-4 h-4 text-emerald-600 animate-bounce" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
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
  );
}
