/**
 * Tally → LifeOS ActivityWatch bridge.
 *
 * Canonical direction after PLANET-1636: this repo only owns the desktop
 * ActivityWatch-compatible export bridge. LifeForge/LifeOS owns product UX and
 * cloud storage. Keep this module dependency-light so it can run from Electron,
 * a small daemon, or a one-shot CLI later.
 */

export type Fetcher = (url: string, init?: any) => Promise<{
  ok: boolean;
  status?: number;
  statusText?: string;
  json(): Promise<any>;
  text?(): Promise<string>;
}>;

export type AwBucket = {
  id: string;
  type?: string;
  hostname?: string;
  client?: string;
  created?: string;
  [key: string]: unknown;
};

export type AwEvent = {
  id?: string | number;
  timestamp: string;
  duration: number;
  data: Record<string, unknown>;
  [key: string]: unknown;
};

export interface AwAdapter {
  listBuckets(): Promise<AwBucket[]>;
  listEvents(bucketId: string, opts?: { start?: string; limit?: number }): Promise<AwEvent[]>;
}

export interface PairingStore {
  getToken(): Promise<string | undefined>;
  setToken(token: string): Promise<void>;
  clearToken?(): Promise<void>;
}

export type BucketCursor = {
  lastTimestamp?: string;
  uploadedKeys: string[];
};

export interface CursorStore {
  get(bucketId: string): Promise<BucketCursor | undefined>;
  set(bucketId: string, cursor: BucketCursor): Promise<void>;
}

export class MemoryPairingStore implements PairingStore {
  private token?: string;
  constructor(initialToken?: string) { this.token = initialToken; }
  async getToken() { return this.token; }
  async setToken(token: string) { this.token = token; }
  async clearToken() { this.token = undefined; }
}

export class MemoryCursorStore implements CursorStore {
  private cursors = new Map<string, BucketCursor>();
  async get(bucketId: string) { return this.cursors.get(bucketId); }
  async set(bucketId: string, cursor: BucketCursor) {
    this.cursors.set(bucketId, { lastTimestamp: cursor.lastTimestamp, uploadedKeys: [...cursor.uploadedKeys] });
  }
}

export class LocalAwRestAdapter implements AwAdapter {
  private baseUrl: string;
  private fetcher: Fetcher;

  constructor(opts: { baseUrl?: string; port?: number; fetcher?: Fetcher } = {}) {
    this.baseUrl = (opts.baseUrl ?? `http://127.0.0.1:${opts.port ?? 5600}`).replace(/\/$/, '');
    this.fetcher = opts.fetcher ?? (globalThis.fetch as unknown as Fetcher);
    if (!this.fetcher) throw new Error('LocalAwRestAdapter requires a fetcher or global fetch.');
  }

  async listBuckets(): Promise<AwBucket[]> {
    const json = await this.getJson(`${this.baseUrl}/api/0/buckets`);
    if (!json || typeof json !== 'object' || Array.isArray(json)) {
      throw new Error('Invalid ActivityWatch buckets payload.');
    }
    return Object.entries(json).map(([id, value]) => normalizeBucket(id, value));
  }

  async listEvents(bucketId: string, opts: { start?: string; limit?: number } = {}): Promise<AwEvent[]> {
    const params = new URLSearchParams();
    if (opts.start) params.set('start', opts.start);
    if (opts.limit) params.set('limit', String(opts.limit));
    const suffix = params.toString() ? `?${params}` : '';
    const json = await this.getJson(`${this.baseUrl}/api/0/buckets/${encodeURIComponent(bucketId)}/events${suffix}`);
    if (!Array.isArray(json)) throw new Error(`Invalid ActivityWatch events payload for ${bucketId}.`);
    return json.map(normalizeEvent);
  }

  private async getJson(url: string): Promise<any> {
    const res = await this.fetcher(url, { method: 'GET' });
    if (!res.ok) throw new Error(`ActivityWatch API failed ${res.status ?? ''} for ${url}`.trim());
    return res.json();
  }
}

export class MockAwAdapter implements AwAdapter {
  constructor(public buckets: Array<AwBucket & { events?: AwEvent[] }>) {}
  async listBuckets(): Promise<AwBucket[]> {
    return this.buckets.map(({ events: _events, ...bucket }) => ({ ...bucket }));
  }
  async listEvents(bucketId: string): Promise<AwEvent[]> {
    return [...(this.buckets.find((b) => b.id === bucketId)?.events ?? [])];
  }
}

export type LifeOsExporterConfig = {
  baseUrl: string;
  deviceId: string;
  token?: string;
  pairingToken?: string;
  ingestPath?: string;
  pairExchangePath?: string;
  fetcher?: Fetcher;
  pairingStore?: PairingStore;
  cursorStore?: CursorStore;
  batchLimit?: number;
};

export type LifeOsIngestPayload = {
  source: 'tally-aw-bridge';
  deviceId: string;
  exportedAt: string;
  buckets: Array<AwBucket & { events: AwEvent[] }>;
};

export class LifeOsExporter {
  private baseUrl: string;
  private fetcher: Fetcher;
  private pairingStore: PairingStore;
  private cursorStore: CursorStore;
  private ingestPath: string;
  private pairExchangePath: string;
  private batchLimit: number;

  constructor(private adapter: AwAdapter, private config: LifeOsExporterConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.fetcher = config.fetcher ?? (globalThis.fetch as unknown as Fetcher);
    this.pairingStore = config.pairingStore ?? new MemoryPairingStore(config.token);
    this.cursorStore = config.cursorStore ?? new MemoryCursorStore();
    this.ingestPath = config.ingestPath ?? '/api/activity/tally/ingest';
    this.pairExchangePath = config.pairExchangePath ?? '/api/activity/tally/pair/exchange';
    this.batchLimit = config.batchLimit ?? 1000;
    if (!this.fetcher) throw new Error('LifeOsExporter requires a fetcher or global fetch.');
  }

  async pair(pairingToken = this.config.pairingToken): Promise<string> {
    if (!pairingToken) throw new Error('Missing Tally/LifeOS pairing token.');
    const res = await this.fetcher(`${this.baseUrl}${this.pairExchangePath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pairingToken, deviceId: this.config.deviceId, app: 'tally-aw-bridge' }),
    });
    if (!res.ok) throw new Error(`LifeOS pairing failed with HTTP ${res.status ?? 'unknown'}`);
    const body = await res.json();
    const token = body?.token ?? body?.deviceToken ?? body?.access_token;
    if (!token || typeof token !== 'string') throw new Error('LifeOS pairing response did not include token/deviceToken.');
    await this.pairingStore.setToken(token);
    return token;
  }

  async exportOnce(): Promise<{ uploadedEvents: number; payload?: LifeOsIngestPayload }> {
    const token = await this.getOrPairToken();
    const payload = await this.buildIncrementalPayload();
    const uploadedEvents = payload.buckets.reduce((n, b) => n + b.events.length, 0);
    if (uploadedEvents === 0) return { uploadedEvents };

    const res = await this.fetcher(`${this.baseUrl}${this.ingestPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Tally-Device-Id': this.config.deviceId,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`LifeOS ingest failed with HTTP ${res.status ?? 'unknown'}`);
    await this.commitPayloadCursors(payload);
    return { uploadedEvents, payload };
  }

  async buildIncrementalPayload(): Promise<LifeOsIngestPayload> {
    const buckets = await this.adapter.listBuckets();
    const out: LifeOsIngestPayload['buckets'] = [];
    for (const bucket of buckets) {
      const cursor = (await this.cursorStore.get(bucket.id)) ?? { uploadedKeys: [] };
      const uploaded = new Set(cursor.uploadedKeys);
      const rawEvents = await this.adapter.listEvents(bucket.id, { start: cursor.lastTimestamp, limit: this.batchLimit });
      const events = rawEvents.map(normalizeEvent).filter((ev) => !uploaded.has(eventKey(bucket.id, ev)));
      if (events.length > 0) out.push({ ...bucket, events });
    }
    return { source: 'tally-aw-bridge', deviceId: this.config.deviceId, exportedAt: new Date().toISOString(), buckets: out };
  }

  private async getOrPairToken(): Promise<string> {
    if (this.config.token) {
      await this.pairingStore.setToken(this.config.token);
      return this.config.token;
    }
    const stored = await this.pairingStore.getToken();
    if (stored) return stored;
    return this.pair();
  }

  private async commitPayloadCursors(payload: LifeOsIngestPayload) {
    for (const bucket of payload.buckets) {
      const prior = (await this.cursorStore.get(bucket.id)) ?? { uploadedKeys: [] };
      const keys = new Set(prior.uploadedKeys);
      let lastTimestamp = prior.lastTimestamp;
      for (const event of bucket.events) {
        keys.add(eventKey(bucket.id, event));
        if (!lastTimestamp || event.timestamp > lastTimestamp) lastTimestamp = event.timestamp;
      }
      await this.cursorStore.set(bucket.id, { lastTimestamp, uploadedKeys: [...keys].slice(-10_000) });
    }
  }
}

function normalizeBucket(id: string, value: unknown): AwBucket {
  if (!value || typeof value !== 'object') return { id };
  return { ...(value as Record<string, unknown>), id } as AwBucket;
}

function normalizeEvent(value: unknown): AwEvent {
  if (!value || typeof value !== 'object') throw new Error('Invalid ActivityWatch event.');
  const ev = value as Record<string, unknown>;
  if (typeof ev.timestamp !== 'string') throw new Error('Invalid ActivityWatch event: timestamp missing.');
  if (typeof ev.duration !== 'number') throw new Error('Invalid ActivityWatch event: duration missing.');
  if (!ev.data || typeof ev.data !== 'object' || Array.isArray(ev.data)) throw new Error('Invalid ActivityWatch event: data missing.');
  return ev as AwEvent;
}

function eventKey(bucketId: string, event: AwEvent): string {
  return `${bucketId}:${event.id ?? `${event.timestamp}:${event.duration}:${stableJson(event.data)}`}`;
}

function stableJson(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return JSON.stringify(value);
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj).sort().map((k) => `${JSON.stringify(k)}:${stableJson(obj[k])}`).join(',')}}`;
}
