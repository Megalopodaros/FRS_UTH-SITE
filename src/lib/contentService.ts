/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ref, set, onValue } from "firebase/database";
import { collection, getDocs, doc, deleteDoc, query, orderBy } from "firebase/firestore";
import { rtdb, db } from "./firebase";
import { DayProgram, StationEvent, OpenCallApplication } from "../types";

/**
 * Subscribe to custom weekly radio schedule in Realtime Database.
 * Zero-cost RTDB sync, falls back to static schedule if not customized.
 */
export function subscribeToCustomSchedule(
  callback: (schedule: DayProgram[] | null) => void
): () => void {
  const scheduleRef = ref(rtdb, "siteConfig/custom_schedule");
  const unsubscribe = onValue(
    scheduleRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val() as DayProgram[]);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.warn("RTDB custom_schedule subscription notice:", error);
      callback(null);
    }
  );

  return () => unsubscribe();
}

/**
 * Save custom schedule to RTDB
 */
export async function saveCustomSchedule(schedule: DayProgram[]): Promise<void> {
  const scheduleRef = ref(rtdb, "siteConfig/custom_schedule");
  await set(scheduleRef, schedule);
}

/**
 * Reset custom schedule in RTDB (clears it back to defaults)
 */
export async function resetCustomSchedule(): Promise<void> {
  const scheduleRef = ref(rtdb, "siteConfig/custom_schedule");
  await set(scheduleRef, null);
}

/**
 * Subscribe to custom station events in Realtime Database.
 * Zero-cost RTDB sync, falls back to default events if not customized.
 */
export function subscribeToCustomEvents(
  callback: (events: StationEvent[] | null) => void
): () => void {
  const eventsRef = ref(rtdb, "siteConfig/custom_events");
  const unsubscribe = onValue(
    eventsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val() as StationEvent[]);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.warn("RTDB custom_events subscription notice:", error);
      callback(null);
    }
  );

  return () => unsubscribe();
}

/**
 * Save custom events to RTDB
 */
export async function saveCustomEvents(events: StationEvent[]): Promise<void> {
  const eventsRef = ref(rtdb, "siteConfig/custom_events");
  await set(eventsRef, events);
}

/**
 * Reset custom events in RTDB (clears it back to defaults)
 */
export async function resetCustomEvents(): Promise<void> {
  const eventsRef = ref(rtdb, "siteConfig/custom_events");
  await set(eventsRef, null);
}

/**
 * Fetch all Open Call producer applications from Firestore
 */
export async function fetchOpenCallApplications(): Promise<OpenCallApplication[]> {
  try {
    const collRef = collection(db, "open_call_applications");
    let snapshot;
    try {
      const q = query(collRef, orderBy("createdAt", "desc"));
      snapshot = await getDocs(q);
    } catch {
      // Fallback if index isn't created yet
      snapshot = await getDocs(collRef);
    }

    const items: OpenCallApplication[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      items.push({
        id: docSnap.id,
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        showConcept: data.showConcept || "",
        musicGenres: data.musicGenres || "",
        createdAt: data.createdAt
      });
    });

    return items;
  } catch (error) {
    console.error("Error fetching open call applications:", error);
    throw error;
  }
}

/**
 * Delete a specific Open Call application from Firestore
 */
export async function deleteOpenCallApplication(applicationId: string): Promise<void> {
  const docRef = doc(db, "open_call_applications", applicationId);
  await deleteDoc(docRef);
}
