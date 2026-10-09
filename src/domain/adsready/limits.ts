// Abuse and load limits for a tool that fetches third-party pages:
// - per target host: at most N checks per minute (we must never become a way to hammer someone's site)
// - global: at most M fetch batches in flight
// - cache: identical requests within the TTL are answered from memory (no second fetch)
// In-memory on purpose (single instance). With several instances, move to a shared store.

export class SlidingWindow {
  private hits = new Map<string, number[]>();
  constructor(private limit: number, private windowMs: number, private now: () => number = Date.now) {}
  /** Returns true and records the hit if allowed. */
  take(key: string): boolean {
    const t = this.now(), list = (this.hits.get(key) ?? []).filter((x) => t - x < this.windowMs);
    if (list.length >= this.limit) { this.hits.set(key, list); return false; }
    list.push(t); this.hits.set(key, list);
    if (this.hits.size > 5000) for (const [k, v] of this.hits) if (!v.some((x) => t - x < this.windowMs)) this.hits.delete(k);
    return true;
  }
}

export class Semaphore {
  private active = 0;
  constructor(private max: number) {}
  tryAcquire(): boolean { if (this.active >= this.max) return false; this.active++; return true; }
  release(): void { this.active = Math.max(0, this.active - 1); }
  get inFlight(): number { return this.active; }
}

export class TtlCache<V> {
  private map = new Map<string, { v: V; at: number }>();
  constructor(private ttlMs: number, private max: number, private now: () => number = Date.now) {}
  get(key: string): V | undefined {
    const e = this.map.get(key);
    if (!e) return undefined;
    if (this.now() - e.at > this.ttlMs) { this.map.delete(key); return undefined; }
    this.map.delete(key); this.map.set(key, e); // LRU touch
    return e.v;
  }
  set(key: string, v: V): void {
    this.map.set(key, { v, at: this.now() });
    while (this.map.size > this.max) this.map.delete(this.map.keys().next().value as string);
  }
}

export class LimitError extends Error {
  constructor(message: string, public retryAfterSec: number) { super(message); }
}
