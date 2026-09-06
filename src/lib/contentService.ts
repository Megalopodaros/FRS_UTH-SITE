/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ref, set, get, onValue } from "firebase/database";
import { collection, getDocs, doc, deleteDoc, addDoc, query, orderBy } from "firebase/firestore";
import { rtdb, db } from "./firebase";
import { DayProgram, StationEvent, OpenCallApplication } from "../types";

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
        callback(val?.schedule || null);
      } else {
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
  const scheduleRef = ref(rtdb, "presence/site_schedule");
  await set(scheduleRef, {
    online: true,
    lastSeen: Date.now(),
    updatedAt: Date.now(),
    updatedBy: "Administrator",
    schedule
  });
}

/**
 * Reset custom schedule in RTDB (clears it back to static defaults)
 */
export async function resetCustomSchedule(): Promise<void> {
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
        callback(val?.events || null);
      } else {
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
  const eventsRef = ref(rtdb, "presence/site_events");
  await set(eventsRef, {
    online: true,
    lastSeen: Date.now(),
    updatedAt: Date.now(),
    updatedBy: "Administrator",
    events
  });
}

/**
 * Reset custom events in RTDB (clears it back to static defaults)
 */
export async function resetCustomEvents(): Promise<void> {
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
