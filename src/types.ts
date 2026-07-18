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

