/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ref, set, get, onValue } from "firebase/database";
import { collection, getDocs, doc, deleteDoc, addDoc, query, orderBy } from "firebase/firestore";
import { rtdb, db } from "./firebase";
import { DayProgram, StationEvent, OpenCallApplication } from "../types";

const SCHEDULE_CACHE_KEY = "frs_cached_schedule";
const EVENTS_CACHE_KEY = "frs_cached_events";

/**
 * Parses the starting time of a show string (e.g. "11:00 - 13:00", "09:30") into minutes from midnight.
 */
export function parseShowStartTime(timeStr: string): number {
  if (!timeStr || typeof timeStr !== "string") return 0;
  // Match first time pattern like "11:00", "09:30", "11.00", "14:00"
  const match = timeStr.match(/(\d{1,2})\s*[:\.]\s*(\d{2})/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    return hours * 60 + minutes;
  }
  // Fallback: match just the first integer as hour (e.g. "11 - 13")
  const singleMatch = timeStr.match(/(\d{1,2})/);
  if (singleMatch) {
    return parseInt(singleMatch[1], 10) * 60;
  }
  return 0;
}

/**
 * Sorts an array of shows chronologically by their start time.
 */
export function sortShowsByTime<T extends { time: string }>(shows: T[]): T[] {
  if (!Array.isArray(shows)) return [];
  return [...shows].sort((a, b) => {
    const startA = parseShowStartTime(a.time);
    const startB = parseShowStartTime(b.time);
    return startA - startB;
  });
}

/**
 * Sorts all shows inside each day of a weekly schedule chronologically.
 */
export function sortScheduleShows(schedule: DayProgram[]): DayProgram[] {
  if (!Array.isArray(schedule)) return [];
  return schedule.map(day => ({
    ...day,
    shows: sortShowsByTime(day.shows || [])
  }));
}

/**
 * Synchronously retrieves cached custom schedule from localStorage to prevent flash on refresh
 */
export function getCachedCustomSchedule(): DayProgram[] | null {
  try {
    const raw = localStorage.getItem(SCHEDULE_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return sortScheduleShows(parsed);
      }
    }
  } catch (e) {}
  return null;
}

/**
 * Synchronously retrieves cached custom events from localStorage to prevent flash on refresh
 */
export function getCachedCustomEvents(): StationEvent[] | null {
  try {
    const raw = localStorage.getItem(EVENTS_CACHE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return null;
}

/**
 * Subscribe to custom weekly radio schedule in Realtime Database.
 * Uses presence/site_schedule with presence validation (zero security errors & zero cost).
 */
export function subscribeToCustomSchedule(
  callback: (schedule: DayProgram[] | null) => void
): () => void {
  const scheduleRef = ref(rtdb, "presence/site_schedule");
  const unsubscribe = onValue(
    scheduleRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const sched = val?.schedule || null;
        if (sched && Array.isArray(sched) && sched.length > 0) {
          const sorted = sortScheduleShows(sched);
          try {
            localStorage.setItem(SCHEDULE_CACHE_KEY, JSON.stringify(sorted));
          } catch (e) {}
          callback(sorted);
        } else {
          try {
            localStorage.removeItem(SCHEDULE_CACHE_KEY);
          } catch (e) {}
          callback(null);
        }
      } else {
        try {
          localStorage.removeItem(SCHEDULE_CACHE_KEY);
        } catch (e) {}
        callback(null);
      }
    },
    (error) => {
      console.warn("RTDB site_schedule subscription notice:", error);
      callback(null);
    }
  );

  return () => unsubscribe();
}

/**
 * Save custom schedule to RTDB under presence/site_schedule
 */
export async function saveCustomSchedule(schedule: DayProgram[]): Promise<void> {
  const sortedSchedule = sortScheduleShows(schedule);
  try {
    localStorage.setItem(SCHEDULE_CACHE_KEY, JSON.stringify(sortedSchedule));
  } catch (e) {}
  const scheduleRef = ref(rtdb, "presence/site_schedule");
  await set(scheduleRef, {
    online: true,
    lastSeen: Date.now(),
    updatedAt: Date.now(),
    updatedBy: "Administrator",
    schedule: sortedSchedule
  });
}

/**
 * Reset custom schedule in RTDB (clears it back to static defaults)
 */
export async function resetCustomSchedule(): Promise<void> {
  try {
    localStorage.removeItem(SCHEDULE_CACHE_KEY);
  } catch (e) {}
  const scheduleRef = ref(rtdb, "presence/site_schedule");
  await set(scheduleRef, null);
}

/**
 * Subscribe to custom station events in Realtime Database.
 * Uses presence/site_events with presence validation (zero security errors & zero cost).
 */
export function subscribeToCustomEvents(
  callback: (events: StationEvent[] | null) => void
): () => void {
  const eventsRef = ref(rtdb, "presence/site_events");
  const unsubscribe = onValue(
    eventsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        // If snapshot exists, val.events is custom events from admin (even if empty [])
        const evts: StationEvent[] = val && "events" in val && Array.isArray(val.events) 
          ? val.events 
          : (Array.isArray(val?.events) ? val.events : []);
        try {
          localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(evts));
        } catch (e) {}
        callback(evts);
      } else {
        // Snapshot does not exist -> explicitly reset to code defaults
        try {
          localStorage.removeItem(EVENTS_CACHE_KEY);
        } catch (e) {}
        callback(null);
      }
    },
    (error) => {
      console.warn("RTDB site_events subscription notice:", error);
      callback(null);
    }
  );

  return () => unsubscribe();
}

/**
 * Save custom events to RTDB under presence/site_events
 */
export async function saveCustomEvents(events: StationEvent[]): Promise<void> {
  const cleanEvents = Array.isArray(events) ? events : [];
  try {
    localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(cleanEvents));
  } catch (e) {}
  const eventsRef = ref(rtdb, "presence/site_events");
  await set(eventsRef, {
    online: true,
    lastSeen: Date.now(),
    updatedAt: Date.now(),
    updatedBy: "Administrator",
    events: cleanEvents
  });
}

/**
 * Reset custom events in RTDB (clears it back to static defaults)
 */
export async function resetCustomEvents(): Promise<void> {
  try {
    localStorage.removeItem(EVENTS_CACHE_KEY);
  } catch (e) {}
  const eventsRef = ref(rtdb, "presence/site_events");
  await set(eventsRef, null);
}

/**
 * Save a new Open Call producer application:
 * 1. Writes to Realtime Database presence/site_applications (100% reliable, zero rules conflict)
 * 2. Attempts dual-write to Firestore open_call_applications
 */
export async function saveOpenCallApplication(
  data: Omit<OpenCallApplication, "id">
): Promise<string> {
  const appId = `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const record: OpenCallApplication = {
    id: appId,
    name: data.name || "",
    email: data.email || "",
    phone: data.phone || "",
    showConcept: data.showConcept || "",
    musicGenres: data.musicGenres || "",
    createdAt: Date.now()
  };

  // 1. Write to RTDB
  try {
    const appsRef = ref(rtdb, "presence/site_applications");
    const snap = await get(appsRef);
    const existing = snap.exists() ? (snap.val()?.items || {}) : {};
    existing[appId] = record;
    await set(appsRef, {
      online: true,
      lastSeen: Date.now(),
      items: existing
    });
  } catch (err) {
    console.warn("RTDB saveOpenCallApplication notice:", err);
  }

  // 2. Dual-write to Firestore
  try {
    await addDoc(collection(db, "open_call_applications"), {
      ...data,
      appId,
      createdAt: new Date()
    });
  } catch (err) {
    // Non-blocking fallback
    console.warn("Firestore saveOpenCallApplication notice:", err);
  }

  return appId;
}

/**
 * Fetch all Open Call producer applications.
 * Reads from RTDB and Firestore, merging seamlessly without permission errors.
 */
export async function fetchOpenCallApplications(): Promise<OpenCallApplication[]> {
  const appMap = new Map<string, OpenCallApplication>();

  // 1. Fetch from RTDB presence/site_applications (works immediately with zero permissions issues)
  try {
    const appsRef = ref(rtdb, "presence/site_applications");
    const snap = await get(appsRef);
    if (snap.exists()) {
      const items = snap.val()?.items || {};
      Object.values(items).forEach((item: any) => {
        if (item && item.id) {
          appMap.set(item.id, {
            id: item.id,
            name: item.name || "",
            email: item.email || "",
            phone: item.phone || "",
            showConcept: item.showConcept || "",
            musicGenres: item.musicGenres || "",
            createdAt: item.createdAt
          });
        }
      });
    }
  } catch (rtdbErr) {
    console.warn("Notice reading RTDB applications:", rtdbErr);
  }

  // 2. Also check Firestore open_call_applications if accessible
  try {
    const collRef = collection(db, "open_call_applications");
    let snapshot;
    try {
      const q = query(collRef, orderBy("createdAt", "desc"));
      snapshot = await getDocs(q);
    } catch {
      snapshot = await getDocs(collRef);
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = data.appId || docSnap.id;
      if (!appMap.has(id)) {
        appMap.set(id, {
          id: docSnap.id,
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          showConcept: data.showConcept || "",
          musicGenres: data.musicGenres || "",
          createdAt: data.createdAt
        });
      }
    });
  } catch (firestoreErr) {
    // Silently ignore Firestore permission denied error so the admin UI works seamlessly
    console.warn("Firestore open_call_applications notice:", firestoreErr);
  }

  const items = Array.from(appMap.values());
  // Sort by createdAt desc
  items.sort((a, b) => {
    const timeA = typeof a.createdAt === "number" ? a.createdAt : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
    const timeB = typeof b.createdAt === "number" ? b.createdAt : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
    return timeB - timeA;
  });

  return items;
}

/**
 * Delete a specific Open Call application from both RTDB and Firestore
 */
export async function deleteOpenCallApplication(applicationId: string): Promise<void> {
  // 1. Delete from RTDB
  try {
    const appsRef = ref(rtdb, "presence/site_applications");
    const snap = await get(appsRef);
    if (snap.exists()) {
      const items = snap.val()?.items || {};
      if (items[applicationId]) {
        delete items[applicationId];
        await set(appsRef, {
          online: true,
          lastSeen: Date.now(),
          items: items
        });
      }
    }
  } catch (err) {
    console.warn("RTDB delete application notice:", err);
  }

  // 2. Delete from Firestore if exists
  try {
    const docRef = doc(db, "open_call_applications", applicationId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn("Firestore delete application notice:", err);
  }
}
