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
        callback({
          isComingSoon: !!val?.isComingSoon,
          updatedAt: val?.updatedAt,
          updatedBy: val?.updatedBy
        });
      } else {
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
