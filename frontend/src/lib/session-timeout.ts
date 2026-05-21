export const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours
export const WARN_BEFORE_MS = 5 * 60 * 1000; // warn 5 minutes before expiry

const SESSION_START_KEY = "vscanmail_session_start";
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

function nowIso() {
  return new Date().toISOString();
}

function readSessionStartMs(): number {
  if (typeof window === "undefined") return Date.now();
  const raw = window.localStorage.getItem(SESSION_START_KEY);
  if (!raw) return Date.now();
  const ms = Date.parse(raw);
  return Number.isNaN(ms) ? Date.now() : ms;
}

function writeSessionStartNow() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_START_KEY, nowIso());
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
  const sessionStartMs = readSessionStartMs();
  const elapsed = Date.now() - sessionStartMs;

  if (elapsed >= SESSION_DURATION_MS) {
    fireExpireOnce({ broadcast: true });
    return;
  }

  if (elapsed >= SESSION_DURATION_MS - WARN_BEFORE_MS) {
    fireWarnOnce();
  }
}

export function stopSessionTimer(): void {
  if (typeof window === "undefined") return;

  if (intervalId) {
    window.clearInterval(intervalId);
    intervalId = null;
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

  window.localStorage.removeItem(SESSION_START_KEY);

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

  writeSessionStartNow();

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
