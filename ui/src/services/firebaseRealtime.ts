/**
 * firebaseRealtime.ts
 * Real-time streaming service for Firebase Realtime Database (RTDB).
 * Uses native browser Server-Sent Events (EventSource) for zero-dependency,
 * high-performance, real-time client subscriptions.
 * 
 * Flow:
 * - Client reads directly from Firebase RTDB in real time.
 * - Writes go through the Backend (Flask API).
 */

const FIREBASE_DB_URL = (
  import.meta.env.VITE_FIREBASE_DATABASE_URL ||
  'https://shwi-f683d-default-rtdb.asia-southeast1.firebasedatabase.app'
).replace(/\/$/, '');

export interface RealtimeHeartRateData {
  bpm: number;
  recordedAt?: string;
  updatedAt?: string;
}

/**
 * Subscribe to real-time Heart Rate updates for a given user.
 * Connects directly to Firebase RTDB path: users/{userId}/heart_rate.json
 * 
 * @param userId ID of the user to monitor
 * @param onUpdate Callback invoked whenever new heart rate data is pushed
 * @returns Cleanup function to close the streaming connection
 */
export function subscribeToHeartRate(
  userId: string | number,
  onUpdate: (data: RealtimeHeartRateData | null) => void
): () => void {
  if (!userId) return () => {};

  const streamUrl = `${FIREBASE_DB_URL}/users/${encodeURIComponent(String(userId))}/heart_rate.json`;
  let eventSource: EventSource | null = null;

  try {
    eventSource = new EventSource(streamUrl);

    const handlePayload = (rawPayload: string) => {
      try {
        const parsed = JSON.parse(rawPayload);
        if (!parsed) return;

        // Firebase RTDB stream sends { path: "/", data: { bpm: ..., recordedAt: ... } }
        if (parsed.path === '/' || !parsed.path) {
          if (parsed.data && typeof parsed.data === 'object' && 'bpm' in parsed.data) {
            onUpdate({
              bpm: Number(parsed.data.bpm),
              recordedAt: parsed.data.recordedAt,
              updatedAt: parsed.data.updatedAt,
            });
          } else if (parsed.data === null) {
            onUpdate(null);
          }
        } else if (parsed.path === '/bpm' && parsed.data !== undefined) {
          onUpdate({ bpm: Number(parsed.data) });
        }
      } catch (err) {
        console.warn('[Firebase Realtime] Failed to parse heart rate stream event:', err);
      }
    };

    eventSource.addEventListener('put', (event: MessageEvent) => {
      handlePayload(event.data);
    });

    eventSource.addEventListener('patch', (event: MessageEvent) => {
      handlePayload(event.data);
    });

    eventSource.onmessage = (event: MessageEvent) => {
      handlePayload(event.data);
    };

    eventSource.onerror = (err) => {
      // EventSource automatically retries connections with backoff
      console.debug('[Firebase Realtime] Heart rate stream reconnecting...', err);
    };
  } catch (err) {
    console.error('[Firebase Realtime] Could not establish heart rate stream:', err);
  }

  return () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}

/**
 * Subscribe to real-time Resting Heart Rate updates for a given user.
 * Connects directly to Firebase RTDB path: users/{userId}/resting_heart_rate.json
 * 
 * @param userId ID of the user to monitor
 * @param onUpdate Callback invoked whenever new resting heart rate data is pushed
 * @returns Cleanup function to close the streaming connection
 */
export function subscribeToRestingHeartRate(
  userId: string | number,
  onUpdate: (data: RealtimeHeartRateData | null) => void
): () => void {
  if (!userId) return () => {};

  const streamUrl = `${FIREBASE_DB_URL}/users/${encodeURIComponent(String(userId))}/resting_heart_rate.json`;
  let eventSource: EventSource | null = null;

  try {
    eventSource = new EventSource(streamUrl);

    const handlePayload = (rawPayload: string) => {
      try {
        const parsed = JSON.parse(rawPayload);
        if (!parsed) return;

        if (parsed.path === '/' || !parsed.path) {
          if (parsed.data && typeof parsed.data === 'object' && 'bpm' in parsed.data) {
            onUpdate({
              bpm: Number(parsed.data.bpm),
              recordedAt: parsed.data.recordedAt,
              updatedAt: parsed.data.updatedAt,
            });
          } else if (parsed.data === null) {
            onUpdate(null);
          }
        } else if (parsed.path === '/bpm' && parsed.data !== undefined) {
          onUpdate({ bpm: Number(parsed.data) });
        }
      } catch (err) {
        console.warn('[Firebase Realtime] Failed to parse resting heart rate stream event:', err);
      }
    };

    eventSource.addEventListener('put', (event: MessageEvent) => {
      handlePayload(event.data);
    });

    eventSource.addEventListener('patch', (event: MessageEvent) => {
      handlePayload(event.data);
    });

    eventSource.onmessage = (event: MessageEvent) => {
      handlePayload(event.data);
    };

    eventSource.onerror = (err) => {
      console.debug('[Firebase Realtime] Resting heart rate stream reconnecting...', err);
    };
  } catch (err) {
    console.error('[Firebase Realtime] Could not establish resting heart rate stream:', err);
  }

  return () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}
