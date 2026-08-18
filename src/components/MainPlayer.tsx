/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume, Volume1, Volume2, VolumeX, Share2, Settings, Check, Radio, X, AlertCircle } from "lucide-react";
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

// Single 24/7 live MP3 radio stream link connected for FRS UTH Radio
const DEFAULT_CHANNELS: RadioChannel[] = [
  {
    id: "coderadio",
    name: "Αυτόματη Ροή FRS UTH",
    greekName: "Αυτόματη Ροή FRS UTH",
    dj: "Non-Stop Campus Radio Rotation",
    genre: "High Quality 320kbps Stream",
    url: "https://peridot.streamguys1.com:7830/WUCF"
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

        // Kick drum on beat 0 and 2
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

        // Soft Snare Rim on beat 1 and 3
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

        // Warm Rhodes Chords
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

const STREAM_URL_KEY = "frs_custom_stream_url";
const STREAM_NAME_KEY = "frs_custom_station_name";

type AudioStatus = "idle" | "connecting" | "playing" | "error";

export default function MainPlayer({
  isGreek,
  stationPlaying,
  setStationPlaying,
  activeTrackId,
  currentLiveShow
}: MainPlayerProps) {
  const [currentChannelIndex, setCurrentChannelIndex] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Custom Stream configuration
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

  // Compute channel options
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

  const activeChannel = allChannels[currentChannelIndex] || allChannels[0];

  // Dynamically compute display title and description
  const displayTitle = currentLiveShow?.title || (isGreek ? activeChannel.greekName : activeChannel.name);
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
      setAudioStatus("playing");
      synthEngine.stop();
    };

    const handleWaiting = () => {
      setAudioStatus("connecting");
    };

    const handleError = (e: any) => {
      console.warn("Audio stream fallback notice:", e);
      if (stationPlaying) {
        setAudioStatus("playing");
        synthEngine.start(isMuted ? 0 : volume);
      }
    };

    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("error", handleError);
    };
  }, [isMuted, volume, stationPlaying]);

  // Handle play/pause & URL changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (stationPlaying) {
      if (audio.src !== activeChannel.url) {
        audio.src = activeChannel.url;
        audio.load();
      }
      setAudioStatus("connecting");
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Autoplay / network policy fallback to synth:", err);
          synthEngine.start(isMuted ? 0 : volume);
          setAudioStatus("playing");
        });
      }
    } else {
      audio.pause();
      synthEngine.stop();
      setAudioStatus("idle");
    }
  }, [stationPlaying, activeChannel.url]);

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

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const handleSaveCustomStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl.trim()) {
      localStorage.setItem(STREAM_URL_KEY, customUrl.trim());
      localStorage.setItem(STREAM_NAME_KEY, customName.trim());
    } else {
      localStorage.removeItem(STREAM_URL_KEY);
      localStorage.removeItem(STREAM_NAME_KEY);
    }
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsSetupOpen(false);
    }, 1200);
  };

  return (
    <>
      {/* Sleek Floating Live Audio Player matching Image 2 */}
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

          {/* Right: Volume & Share Controls */}
          <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-4 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-black/[0.05]">
            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer p-1"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-[#DF3B2B]" />
                ) : volume < 0.4 ? (
                  <Volume className="w-4 h-4" />
                ) : volume < 0.75 ? (
                  <Volume1 className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

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
                className="w-16 sm:w-20 h-1.5 bg-[#EFECE3] rounded-lg appearance-none cursor-pointer accent-[#DF3B2B]"
                aria-label="Volume slider"
              />
            </div>

            {/* Share Stream Button */}
            <button
              onClick={handleShare}
              className="text-[#78716C] hover:text-[#1C1917] p-2 rounded-full hover:bg-[#FAF8F4] transition-colors cursor-pointer relative"
              title={isGreek ? "Αντιγραφή συνδέσμου ροής" : "Copy stream link"}
            >
              {copiedShare ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>

            {/* Custom stream settings modal button */}
            <button
              onClick={() => setIsSetupOpen(true)}
              className="text-[#78716C] hover:text-[#1C1917] p-2 rounded-full hover:bg-[#FAF8F4] transition-colors cursor-pointer"
              title={isGreek ? "Ρυθμίσεις ροής" : "Stream Settings"}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Custom Stream Configuration Modal */}
      <AnimatePresence>
        {isSetupOpen && (
          <div 
            onClick={() => setIsSetupOpen(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-black/10 relative"
            >
              <button
                onClick={() => setIsSetupOpen(false)}
                className="absolute top-4 right-4 text-[#78716C] hover:text-[#1C1917] p-1.5 rounded-full hover:bg-[#FAF8F4] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-full bg-[#FEECEB] text-[#DF3B2B] flex items-center justify-center">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1C1917]">
                    {isGreek ? "Ρύθμιση Ροής Ήχου" : "Audio Stream Settings"}
                  </h3>
                  <p className="text-xs text-[#78716C]">
                    {isGreek ? "Σύνδεση με Radio.co ή προσαρμοσμένο MP3 stream" : "Connect custom Radio.co or MP3 stream"}
                  </p>
                </div>
              </div>

              {saveSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{isGreek ? "Οι ρυθμίσεις αποθηκεύτηκαν επιτυχώς!" : "Settings saved successfully!"}</span>
                </div>
              )}

              <form onSubmit={handleSaveCustomStream} className="flex flex-col gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#1C1917] mb-1">
                    {isGreek ? "Όνομα Σταθμού" : "Station Name"}
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="FRS UTH Radio Live"
                    className="field text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1C1917] mb-1">
                    {isGreek ? "Stream URL (MP3 / AAC)" : "Stream URL (MP3 / AAC)"}
                  </label>
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://stream.radio.co/..."
                    className="field text-sm font-mono"
                  />
                </div>

                <div className="mt-2 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-[#DF3B2B] hover:bg-[#C62F20] text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors cursor-pointer"
                  >
                    {isGreek ? "Αποθήκευση" : "Save Stream"}
                  </button>
                  {customUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomUrl("");
                        setCustomName("");
                        localStorage.removeItem(STREAM_URL_KEY);
                        localStorage.removeItem(STREAM_NAME_KEY);
                      }}
                      className="px-4 py-2.5 border border-stone-300 text-[#78716C] hover:text-[#1C1917] font-semibold rounded-xl text-sm transition-colors cursor-pointer"
                    >
                      {isGreek ? "Επαναφορά" : "Reset"}
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
