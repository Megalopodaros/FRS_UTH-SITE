/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ref, set, onValue } from "firebase/database";
import { collection, getDocs, writeBatch } from "firebase/firestore";
import { rtdb, db } from "./firebase";
import { SiteConfig } from "../types";
import { PRODUCER_PIN_KEY, PRODUCER_NAME_KEY, clearActivePoll } from "./pollService";

export const ADMIN_PIN_KEY = "frs_admin_authenticated";
export const DEFAULT_ADMIN_PIN = "admin2026";

/**
 * Check if the current browser session has unlocked admin controls
 */
export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(ADMIN_PIN_KEY) === "true";
}

/**
 * Verify Admin PIN and grant both Admin and Producer permissions
 */
export function verifyAdminPin(pin: string): boolean {
  if (pin.trim() === DEFAULT_ADMIN_PIN) {
    sessionStorage.setItem(ADMIN_PIN_KEY, "true");
    sessionStorage.setItem(PRODUCER_PIN_KEY, "true");
    sessionStorage.setItem(PRODUCER_NAME_KEY, "Administrator");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("frs_admin_auth_changed"));
    }
    return true;
  }
  return false;
}

/**
 * Log out from admin mode
 */
export function logoutAdmin(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ADMIN_PIN_KEY);
  sessionStorage.removeItem(PRODUCER_PIN_KEY);
  sessionStorage.removeItem(PRODUCER_NAME_KEY);
  window.dispatchEvent(new Event("frs_admin_auth_changed"));
}

export const COMING_SOON_CACHE_KEY = "frs_cached_coming_soon";

/**
 * Synchronously retrieves cached Coming Soon state from localStorage.
 * Returns null if never cached on this browser before.
 */
export function getCachedComingSoon(): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    const val = localStorage.getItem(COMING_SOON_CACHE_KEY);
    if (val === null) return null;
    return val === "true";
  } catch {
    return null;
  }
}

/**
 * Cache Coming Soon state locally for instant zero-latency initial renders.
 */
export function setCachedComingSoon(isComingSoon: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COMING_SOON_CACHE_KEY, isComingSoon ? "true" : "false");
  } catch {
    // Ignore quota/permission errors
  }
}

/**
 * Subscribe to site-wide configuration in Firebase Realtime Database.
 * Uses presence/site_status path which has granted permissions under deployed RTDB rules.
 * Consumes 0 Firestore reads/writes (optimal for Firebase Spark free plan).
 */
export function subscribeToSiteConfig(
  callback: (config: SiteConfig | null) => void
): () => void {
  const configRef = ref(rtdb, "presence/site_status");

  const unsubscribe = onValue(
    configRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const isComingSoon = !!val?.isComingSoon;
        setCachedComingSoon(isComingSoon);
        callback({
          isComingSoon,
          updatedAt: val?.updatedAt,
          updatedBy: val?.updatedBy
        });
      } else {
        setCachedComingSoon(false);
        callback({ isComingSoon: false });
      }
    },
    (error) => {
      console.warn("RTDB siteConfig subscription notice:", error);
      callback({ isComingSoon: false });
    }
  );

  return () => {
    unsubscribe();
  };
}

/**
 * Toggle the site-wide Coming Soon screen for all visitors
 */
export async function setComingSoonMode(enabled: boolean): Promise<void> {
  setCachedComingSoon(enabled);
  const configRef = ref(rtdb, "presence/site_status");
  await set(configRef, {
    online: true,
    lastSeen: Date.now(),
    isComingSoon: enabled,
    updatedAt: Date.now(),
    updatedBy: "Administrator"
  });
}

/**
 * Reset chat and active polls:
 * 1. Permanently delete all chat messages from Firestore
 * 2. Clear any active voting poll from Realtime Database
 */
export async function resetChatAndPolls(): Promise<{ messagesDeleted: number; pollCleared: boolean }> {
  let messagesDeleted = 0;

  try {
    // 1. Fetch all Firestore chat messages
    const messagesCollection = collection(db, "messages");
    const snapshot = await getDocs(messagesCollection);

    if (!snapshot.empty) {
      const docs = snapshot.docs;
      const chunkSize = 400; // Batch limit is 500 in Firestore
      
      for (let i = 0; i < docs.length; i += chunkSize) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + chunkSize);
        chunk.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
        messagesDeleted += chunk.length;
      }
    }
  } catch (error) {
    console.error("Failed to delete Firestore messages during admin reset:", error);
    throw error;
  }

  // 2. Clear active poll in RTDB
  try {
    await clearActivePoll();
  } catch (error) {
    console.error("Failed to clear RTDB active poll during admin reset:", error);
    throw error;
  }

  return { messagesDeleted, pollCleared: true };
}
