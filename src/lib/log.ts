import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { ChatEvent, TrackEvent } from "./types";

// Process-wide logs. Next keeps one node process, so the in-memory arrays
// survive requests; the JSONL files survive restarts.
const g = globalThis as typeof globalThis & { __events?: ChatEvent[]; __tracks?: TrackEvent[] };
const events: ChatEvent[] = (g.__events ??= []);
const tracks: TrackEvent[] = (g.__tracks ??= []);
const MAX = 2000;

const dataDir = path.join(process.cwd(), "data");
const files = { events: path.join(dataDir, "events.jsonl"), tracks: path.join(dataDir, "track.jsonl") };

function append<T>(list: T[], file: string, item: T): T {
  list.push(item);
  if (list.length > MAX) list.splice(0, list.length - MAX);
  if (process.env.LOG_JSONL === "0") return item;
  try {
    mkdirSync(dataDir, { recursive: true });
    appendFileSync(file, JSON.stringify(item) + "\n");
  } catch {
    // the file is a convenience; memory is the source of truth
  }
  return item;
}

function hydrate<T>(list: T[], file: string): T[] {
  if (list.length === 0 && process.env.LOG_JSONL !== "0") {
    try {
      const lines = readFileSync(file, "utf8").split("\n").filter(Boolean);
      for (const line of lines.slice(-MAX)) list.push(JSON.parse(line) as T);
    } catch {
      // no file yet
    }
  }
  return list;
}

export const record = (e: ChatEvent) => append(events, files.events, e);
export const recordTrack = (t: TrackEvent) => append(tracks, files.tracks, t);
export const allEvents = () => hydrate(events, files.events);
export const allTracks = () => hydrate(tracks, files.tracks);
export const findEvent = (id: string) => allEvents().find((e) => e.id === id);
