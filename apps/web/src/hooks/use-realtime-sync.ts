"use client";

import { useEffect, useRef } from "react";
import { useMailStore } from "@/lib/store";

export function useRealtimeSync() {
  const { triggerRefresh } = useMailStore();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Connect to SSE endpoint for real-time updates
    const eventSource = new EventSource("/api/gmail/stream");
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_email") {
          triggerRefresh();
        }
      } catch (error) {
        console.error("SSE parse error:", error);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setTimeout(() => {
        eventSourceRef.current = new EventSource("/api/gmail/stream");
      }, 5000);
    };

    return () => {
      eventSource.close();
    };
  }, [triggerRefresh]);
}
