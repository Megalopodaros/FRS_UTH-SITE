/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ref, set, onValue } from "firebase/database";
import { rtdb } from "./firebase";
import { AdSpaceConfig } from "../types";

export const AD_SPACE_CACHE_KEY = "frs_cached_ad_space";

export const DEFAULT_AD_SPACE_CONFIG: AdSpaceConfig = {
  enabled: false,
  sponsorName: "Volos Specialty Coffee & Vinyl",
  text: "Στηρίζουμε τη φοιτητική κοινότητα του Π.Θ. – 15% έκπτωση σε όλους τους φοιτητές με επίδειξη πάσου!",
  link: "https://uth.gr",
  badge: "Επίσημος Χορηγός",
  imageUrl: "/shows/vinyl.jpg",
  ctaText: "Επίσκεψη στο Κατάστημα"
};

/**
 * Synchronously retrieves cached ad space configuration from localStorage for zero-latency render.
 */
export function getCachedAdSpace(): AdSpaceConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AD_SPACE_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch {}
  return null;
}

/**
 * Cache ad space configuration locally in localStorage
 */
export function setCachedAdSpace(config: AdSpaceConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AD_SPACE_CACHE_KEY, JSON.stringify(config));
  } catch {}
}

/**
 * Subscribe to live Ad Space configuration from Firebase Realtime Database.
 * Uses presence/site_ad to comply with presence-validated RTDB rules (Spark free plan safe).
 */
export function subscribeToAdSpace(
  callback: (config: AdSpaceConfig | null) => void
): () => void {
  const adRef = ref(rtdb, "presence/site_ad");
  const unsubscribe = onValue(
    adRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const ad = val?.adSpace || null;
        if (ad && typeof ad === "object") {
          setCachedAdSpace(ad);
          callback(ad);
          return;
        }
      }
      callback(null);
    },
    (error) => {
      console.warn("RTDB site_ad subscription notice:", error);
      callback(null);
    }
  );

  return () => unsubscribe();
}

/**
 * Save ad space configuration to RTDB and local cache
 */
export async function saveAdSpaceConfig(config: AdSpaceConfig): Promise<void> {
  const payload: AdSpaceConfig = {
    enabled: !!config.enabled,
    sponsorName: config.sponsorName?.trim() || "",
    text: config.text?.trim() || "",
    link: config.link?.trim() || "",
    badge: config.badge?.trim() || "Υποστηρικτής",
    imageUrl: config.imageUrl?.trim() || "",
    ctaText: config.ctaText?.trim() || "",
    updatedAt: Date.now()
  };

  setCachedAdSpace(payload);

  const adRef = ref(rtdb, "presence/site_ad");
  await set(adRef, {
    online: true,
    lastSeen: Date.now(),
    adSpace: payload,
    updatedAt: Date.now(),
    updatedBy: "Administrator"
  });
}
