export const INACTIVITY_LIMIT_MS = 60 * 60 * 1000; // 60 minutes
export const WARN_BEFORE_MS = 5 * 60 * 1000; // warn at 55 minutes

const LAST_ACTIVITY_KEY = "vscanmail_last_activity";
const CHANNEL_NAME = "vscanmail_session";

type Callback = () => void;

let intervalId: number | null = null;
let warned = false;
let expired = false;
let started = false;

let onExpireCb: Callback | null = null;
let onWarnCb: Callback | null = null;

let channel: BroadcastChannel | null = null;
let onChannelMessage: ((e: MessageEvent) => void) | null = null;

type ActivityEventName = "mousemove" | "mousedown" | "keydown" | "touchstart" | "scroll";
const ACTIVITY_EVENTS: ActivityEventName[] = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];

function nowIso() {
  return new Date().toISOString();
}

function readLastActivityMs(): number {
  if (typeof window === "undefined") return Date.now();
  const raw = window.localStorage.getItem(LAST_ACTIVITY_KEY);
  if (!raw) return Date.now();
  const ms = Date.parse(raw);
  return Number.isNaN(ms) ? Date.now() : ms;
}

function writeLastActivityNow() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_ACTIVITY_KEY, nowIso());
}

function fireWarnOnce() {
  if (warned || expired) return;
  warned = true;
  onWarnCb?.();
}

function fireExpireOnce({ broadcast }: { broadcast: boolean }) {
  if (expired) return;
  expired = true;

  if (broadcast && typeof window !== "undefined") {
    try {
      channel?.postMessage({ type: "SESSION_EXPIRED" });
    } catch {
      // ignore
    }
  }

  onExpireCb?.();
}

function tick() {
  if (typeof window === "undefined") return;
  const last = readLastActivityMs();
  const elapsed = Date.now() - last;

  if (elapsed >= INACTIVITY_LIMIT_MS) {
    fireExpireOnce({ broadcast: true });
    return;
  }

  if (elapsed >= INACTIVITY_LIMIT_MS - WARN_BEFORE_MS) {
    fireWarnOnce();
  }
}

export function resetSessionTimer(): void {
  if (typeof window === "undefined") return;
  if (!started) return;
  writeLastActivityNow();
  warned = false;
}

export function stopSessionTimer(): void {
  if (typeof window === "undefined") return;

  if (intervalId) {
    window.clearInterval(intervalId);
    intervalId = null;
  }

  for (const evt of ACTIVITY_EVENTS) {
    window.removeEventListener(evt, resetSessionTimer as EventListener);
  }

  if (channel && onChannelMessage) {
    try {
      channel.removeEventListener("message", onChannelMessage);
      channel.close();
    } catch {
      // ignore
    }
  }
  channel = null;
  onChannelMessage = null;

  window.localStorage.removeItem(LAST_ACTIVITY_KEY);

  started = false;
  warned = false;
  expired = false;
  onExpireCb = null;
  onWarnCb = null;
}

export function startSessionTimer(onExpire: Callback, onWarn: Callback): void {
  if (typeof window === "undefined") return;

  if (started) {
    onExpireCb = onExpire;
    onWarnCb = onWarn;
    return;
  }

  started = true;
  warned = false;
  expired = false;
  onExpireCb = onExpire;
  onWarnCb = onWarn;

  writeLastActivityNow();

  for (const evt of ACTIVITY_EVENTS) {
    window.addEventListener(evt, resetSessionTimer as EventListener, { passive: true });
  }

  channel = new BroadcastChannel(CHANNEL_NAME);
  onChannelMessage = (e: MessageEvent) => {
    const data = e?.data as any;
    if (data?.type === "SESSION_EXPIRED") {
      fireExpireOnce({ broadcast: false });
    }
  };
  channel.addEventListener("message", onChannelMessage);

  intervalId = window.setInterval(tick, 30_000);
}

