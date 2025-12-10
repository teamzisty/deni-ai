import {
  clearInterval as nodeClearInterval,
  setInterval as nodeSetInterval,
} from "node:timers";

type EventPayload = {
  type: string;
  payload?: unknown;
};

function toSSE(data: EventPayload) {
  const json = JSON.stringify(data);
  return `data: ${json}\n\n`;
}

type Subscriber = {
  push: (payload: EventPayload) => void;
  close: () => void;
};

class EventHub {
  private channels = new Map<string, Set<Subscriber>>();

  subscribe(userId: string) {
    const encoder = new TextEncoder();
    let pingTimer: ReturnType<typeof nodeSetInterval> | undefined;

    let sub: Subscriber | undefined;
    const stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        const push = (payload: EventPayload) => {
          controller.enqueue(encoder.encode(toSSE(payload)));
        };

        const close = () => {
          controller.close();
        };

        sub = { push, close };
        if (!this.channels.has(userId)) this.channels.set(userId, new Set());
        const set = this.channels.get(userId);
        if (set) set.add(sub);

        // Initial hello event to confirm subscription.
        push({ type: "connected" });

        // Keep-alive pings for proxies/load balancers.
        pingTimer = nodeSetInterval(() => {
          try {
            controller.enqueue(encoder.encode(": ping\n\n"));
          } catch {
            // Ignore enqueue errors on closed streams.
          }
        }, 15000);
      },
      cancel: () => {
        if (pingTimer) nodeClearInterval(pingTimer);
        const set = this.channels.get(userId);
        if (!set) return;
        if (sub) set.delete(sub);
      },
    });

    return { stream } as const;
  }

  emit(userId: string, payload: EventPayload) {
    const set = this.channels.get(userId);
    if (!set || set.size === 0) return;
    for (const sub of set) {
      try {
        sub.push(payload);
      } catch {
        // Best-effort; drop failed subscriber from the set.
        set.delete(sub);
      }
    }
  }
}

export const events = new EventHub();
