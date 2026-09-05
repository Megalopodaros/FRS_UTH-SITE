/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ref, set, onValue, runTransaction, update } from "firebase/database";
import { rtdb } from "./firebase";
import { LivePollData, PollOption } from "../types";

export const PRODUCER_PIN_KEY = "frs_producer_authenticated";
export const PRODUCER_NAME_KEY = "frs_producer_name";
export const DEFAULT_PRODUCER_PIN = "frs2026";

/**
 * Check if the current browser session has unlocked producer controls
 */
export function isProducerAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(PRODUCER_PIN_KEY) === "true";
}

/**
 * Authenticate producer with PIN
 */
export function verifyProducerPin(pin: string, name?: string): boolean {
  if (pin.trim() === DEFAULT_PRODUCER_PIN) {
    sessionStorage.setItem(PRODUCER_PIN_KEY, "true");
    if (name) {
      sessionStorage.setItem(PRODUCER_NAME_KEY, name.trim());
    }
    return true;
  }
  return false;
}

/**
 * Log out from producer mode
 */
export function logoutProducer(): void {
  sessionStorage.removeItem(PRODUCER_PIN_KEY);
  sessionStorage.removeItem(PRODUCER_NAME_KEY);
}

/**
 * Sanitize a sessionId for safe use as a Firebase Realtime Database path key
 */
function sanitizeSessionKey(sessionId: string): string {
  return sessionId.replace(/[.#$[\]/]/g, "_");
}

/**
 * Subscribe to the currently active poll in real-time.
 * Uses Firebase Realtime Database which consumes 0 Firestore reads/writes,
 * perfectly optimal for the Firebase Spark (Free) plan.
 */
export function subscribeToActivePoll(
  callback: (poll: LivePollData | null) => void
): () => void {
  const pollRef = ref(rtdb, "activePoll");

  const unsubscribe = onValue(
    pollRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val() as LivePollData;
        // Normalize options array if stored as an object
        let options: PollOption[] = [];
        if (Array.isArray(val.options)) {
          options = val.options;
        } else if (val.options && typeof val.options === "object") {
          options = Object.values(val.options);
        }

        callback({
          ...val,
          options,
          totalVotes: val.totalVotes || 0,
          voters: val.voters || {}
        });
      } else {
        callback(null);
      }
    },
    (error) => {
      console.warn("RTDB poll subscription notice:", error);
      callback(null);
    }
  );

  return () => {
    unsubscribe();
  };
}

/**
 * Create and broadcast a new live voting poll
 */
export async function createLivePoll(
  question: string,
  optionsList: string[],
  durationMinutes: number,
  producerName: string = "Radio Producer"
): Promise<void> {
  const cleanQuestion = question.trim();
  const cleanOptions: PollOption[] = optionsList
    .map((opt, i) => ({
      id: `opt_${i + 1}`,
      text: opt.trim(),
      votes: 0
    }))
    .filter((opt) => opt.text.length > 0);

  if (!cleanQuestion || cleanOptions.length < 2) {
    throw new Error("A poll requires a question and at least 2 options.");
  }

  const now = Date.now();
  const expiresAt = now + durationMinutes * 60 * 1000;

  const pollData: LivePollData = {
    id: `poll_${now}`,
    question: cleanQuestion,
    options: cleanOptions,
    createdAt: now,
    durationMinutes,
    expiresAt,
    isActive: true,
    createdBy: producerName,
    voters: {},
    totalVotes: 0,
    announcedResult: false
  };

  const pollRef = ref(rtdb, "activePoll");
  await set(pollRef, pollData);
}

/**
 * Cast or change vote atomically in Realtime Database
 */
export async function castVote(
  optionId: string,
  sessionId: string
): Promise<{ success: boolean; message?: string }> {
  if (!sessionId) {
    return { success: false, message: "No session ID provided." };
  }

  const voterKey = sanitizeSessionKey(sessionId);
  const pollRef = ref(rtdb, "activePoll");

  try {
    const result = await runTransaction(pollRef, (currentPoll: LivePollData | null) => {
      if (!currentPoll) {
        return currentPoll; // No active poll
      }

      // Check if poll expired
      if (Date.now() > currentPoll.expiresAt || !currentPoll.isActive) {
        currentPoll.isActive = false;
        return currentPoll;
      }

      // Ensure data structures exist
      if (!currentPoll.voters) {
        currentPoll.voters = {};
      }

      let options: PollOption[] = [];
      if (Array.isArray(currentPoll.options)) {
        options = currentPoll.options;
      } else if (currentPoll.options && typeof currentPoll.options === "object") {
        options = Object.values(currentPoll.options);
      }

      const previousOptionId = currentPoll.voters[voterKey];

      // If user is clicking the same option they already voted for, do nothing
      if (previousOptionId === optionId) {
        return currentPoll;
      }

      // Decrement vote from previous option if switching
      if (previousOptionId) {
        const prevOpt = options.find((o) => o.id === previousOptionId);
        if (prevOpt) {
          prevOpt.votes = Math.max(0, (prevOpt.votes || 0) - 1);
        }
      }

      // Increment vote for new option
      const newOpt = options.find((o) => o.id === optionId);
      if (newOpt) {
        newOpt.votes = (newOpt.votes || 0) + 1;
      }

      // Update voter record
      currentPoll.voters[voterKey] = optionId;
      currentPoll.options = options;

      // Recalculate total votes
      currentPoll.totalVotes = options.reduce((sum, opt) => sum + (opt.votes || 0), 0);

      return currentPoll;
    });

    if (result.committed) {
      return { success: true };
    } else {
      return { success: false, message: "Transaction could not be completed." };
    }
  } catch (err: any) {
    console.error("Error casting vote:", err);
    return { success: false, message: err?.message || "Failed to vote." };
  }
}

/**
 * Manually close the active poll
 */
export async function endActivePoll(): Promise<void> {
  const pollRef = ref(rtdb, "activePoll");
  await update(pollRef, {
    isActive: false,
    expiresAt: Date.now()
  });
}

/**
 * Clear the active poll from the system
 */
export async function clearActivePoll(): Promise<void> {
  const pollRef = ref(rtdb, "activePoll");
  await set(pollRef, null);
}

/**
 * Mark that the final winning result has been announced to chat
 */
export async function markPollResultAnnounced(): Promise<void> {
  const pollRef = ref(rtdb, "activePoll");
  await update(pollRef, {
    announcedResult: true
  });
}
