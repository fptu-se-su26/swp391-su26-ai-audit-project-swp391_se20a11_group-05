import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { getToken } from "@/lib/api";

interface NotificationPayload {
  type: string;
  feedbackId: number | null;
  title: string;
  message: string;
}

/**
 * React hook để subscribe vào WebSocket STOMP endpoint.
 * Fallback về polling khi WebSocket không khả dụng.
 */
export function useFeedbackNotification(feedbackId?: number | string) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { user } = useAuth();

  const connect = useCallback(() => {
    if (!user) return;
    const token = getToken();
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const url = `${protocol}//${host}/ws-native`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        // Authenticate with CONNECT frame
        ws.send(`CONNECT\nAuthorization:Bearer ${token}\naccept-version:1.2\n\n\0`);

        // Subscribe to topics
        if (feedbackId) {
          ws.send(
            `SUBSCRIBE\nid:feedback-${feedbackId}\ndestination:/topic/feedback/${feedbackId}\n\n\0`,
          );
        }
        ws.send(`SUBSCRIBE\nid:staff\ndestination:/topic/staff\n\n\0`);
      };

      ws.onmessage = (event) => {
        try {
          const payloadStr = String(event.data);
          let bodyStart = payloadStr.indexOf("\r\n\r\n");
          let headerLength = 4;
          if (bodyStart === -1) {
            bodyStart = payloadStr.indexOf("\n\n");
            headerLength = 2;
          }
          if (!payloadStr.startsWith("MESSAGE") || bodyStart === -1) return;

          const body = payloadStr.slice(bodyStart + headerLength).replace(/\0$/, "");
          const payload: NotificationPayload = JSON.parse(body);

          toast.info(payload.title, {
            description: payload.message,
          });
          void queryClient.invalidateQueries({ queryKey: ["notifications"] });
          void queryClient.invalidateQueries({ queryKey: ["feedbacks"] });
        } catch {
          // ignore parsing errors or non-JSON bodies
        }
      };

      ws.onclose = () => {
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      };
    } catch {
      // WebSocket not available — silently degrade
    }
  }, [feedbackId, user]);

  useEffect(() => {
    if (!user) return;
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      const socket = wsRef.current;
      if (socket) {
        socket.onclose = null;
        socket.onerror = null;
        socket.onmessage = null;
        if (socket.readyState === WebSocket.CONNECTING) {
          socket.onopen = () => {
            socket.close();
          };
        } else {
          socket.close();
        }
        wsRef.current = null;
      }
    };
  }, [connect, user]);
}
