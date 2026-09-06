/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Show {
  id: string;
  title: string;
  time: string; // e.g. "18:00 - 20:00"
  host: string;
  tags: string[];
  isLive?: boolean;
  description?: string;
}

export interface DayProgram {
  day: string; // e.g. "Mon" / "Δευ"
  fullName: string; // e.g. "Monday" / "Δευτέρα"
  shows: Show[];
}

export interface ShowDescription {
  id: string;
  title: string;
  host: string;
  description: string;
  tags: string[];
  image: string;
}

export interface ArchiveItem {
  id: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  image: string;
  mixcloudUrl?: string;
}

export interface ChatMessage {
  id: string;
  user: string;
  text: string;
  timestamp: string; // e.g. "19:42" or ISO string
  isSystem?: boolean;
  avatarColor?: string;
  sessionId?: string;
}

export interface RadioChannel {
  id: string;
  name: string;
  greekName: string;
  dj: string;
  genre: string;
  url: string;
  isCustom?: boolean;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface LivePollData {
  id: string;
  question: string;
  options: PollOption[];
  createdAt: number;
  durationMinutes: number;
  expiresAt: number;
  isActive: boolean;
  createdBy: string;
  voters?: Record<string, string>; // sanitized sessionId -> optionId
  totalVotes: number;
  announcedResult?: boolean;
}

export interface SiteConfig {
  isComingSoon: boolean;
  updatedAt?: number;
  updatedBy?: string;
}

export interface StationEvent {
  id: string;
  dayNum: string; // e.g. "18"
  monthStr: string; // e.g. "ΜΑΙ"
  categoryBadge: string; // e.g. "Festival & Outdoor Stage"
  timeLocation: string; // e.g. "🕒 19:30 • 📍 Πεδίον του Άρεως, Βόλος"
  title: string;
  description: string;
  tags: string[];
}

export interface OpenCallApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  showConcept: string;
  musicGenres: string;
  createdAt?: any;
}


