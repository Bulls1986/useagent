import { ENGINES } from "@/components/chat/types";
import type { DotTone } from "@/components/shared/status-dot";

/**
 * Domain types + helpers for the Automations surface. Pure and isomorphic (no
 * React, no "use client") so both the server page and the client view can
 * import it. Fetching lives in `schedules-api.ts`.
 */

/** Legacy display metadata only. These ids must never become picker options. */
const LEGACY_ENGINE_LABEL: Record<string, string> = {
  "claude-sdk": "Claude SDK",
  daytona: "Cloud",
  mock: "Mock",
  acp: "ACP",
};

export function engineLabel(engine: string): string {
  return ENGINES.find(({ id }) => id === engine)?.label ?? LEGACY_ENGINE_LABEL[engine] ?? engine;
}

export interface AutomationEngineOption {
  id: string;
  label: string;
}

/** Project the server-enabled ids through chat's current engine catalog. */
export function automationEngineOptions(
  enabledEngines: readonly string[],
): AutomationEngineOption[] {
  return ENGINES.filter(({ id }) => enabledEngines.includes(id)).map(({ id, label }) => ({
    id,
    label,
  }));
}

/** Keep a disabled draft's stored engine visible while editing it. The engine
 * remains unavailable for new automations and cannot run until connected. */
export function automationEditorEngineOptions(
  enabledEngines: readonly string[],
  storedEngine?: string,
): AutomationEngineOption[] {
  const options = automationEngineOptions(enabledEngines);
  if (!storedEngine || options.some(({ id }) => id === storedEngine)) return options;
  return [{ id: storedEngine, label: `${engineLabel(storedEngine)} (unavailable)` }, ...options];
}

/** Keep a new draft on a live option as server capabilities resolve or change. */
export function reconcileAutomationEngine(
  options: readonly AutomationEngineOption[],
  current: string,
): string {
  return options.some(({ id }) => id === current) ? current : (options[0]?.id ?? "");
}

/** Wire shape from `GET /api/automations` (snake_case, per the backend contract). */
export interface ScheduleRecord {
  id: string;
  org_id: string;
  user_id: string | null;
  name: string;
  cron: string;
  timezone: string | null;
  prompt: string;
  engine: string;
  model: string;
  skill_id: string | null;
  skill_version: number | null;
  skill_content_hash: string | null;
  repos: string[];
  tags: string[];
  delivery: Record<string, unknown> | null;
  notifications: Record<string, unknown> | null;
  run_actor_id: string | null;
  concurrency: Record<string, unknown> | null;
  queue: Record<string, unknown> | null;
  cost_limits: Record<string, unknown> | null;
  frequency_limits: Record<string, unknown> | null;
  approval_policy: Record<string, unknown> | null;
  enablement_policy: Record<string, unknown> | null;
  enabled: boolean;
  /** The cron loop's last tick; null for an automation only ever run by hand. */
  last_fired_at: string | null;
  /** When it last ran by any trigger, cron or Run now (newest firing in the log). */
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

/** The moment an automation last ran, whichever trigger fired it. */
export function lastRunAt(schedule: Pick<ScheduleRecord, "last_run_at" | "last_fired_at">): string | null {
  return schedule.last_run_at ?? schedule.last_fired_at;
}

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function clockLabel(hour: number, minute: number): string {
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

/**
 * Explain the common cadences offered by the editor. Unknown expressions stay
 * explicit rather than receiving a misleading best-effort interpretation.
 */
export function cadenceLabel(cron: string): string {
  const fields = cron.trim().split(/\s+/);
  if (fields.length !== 5) return cron;
  // Never verbalize an expression the scheduler would reject: an out-of-range
  // field (minute 61) would otherwise read as a plausible time ("9:61 AM").
  if (!isValidCron(cron)) return cron;
  const [minuteField, hourField, day, month, weekday] = fields;
  if (day !== "*" || month !== "*") return cron;

  if (hourField === "*" && minuteField === "0" && weekday === "*") {
    return "Every hour";
  }
  const minuteInterval = minuteField?.match(/^\*\/(\d+)$/)?.[1];
  if (hourField === "*" && minuteInterval && weekday === "*") {
    return `Every ${minuteInterval} minutes`;
  }

  const minute = Number(minuteField);
  const hour = Number(hourField);
  if (!Number.isInteger(minute) || !Number.isInteger(hour)) return cron;
  const time = clockLabel(hour, minute);
  if (weekday === "*") return `Every day at ${time}`;
  const days = weekdaySet(weekday);
  if (!days) return cron;
  if (days.length === 7) return `Every day at ${time}`;
  if (days.join(",") === "1,2,3,4,5") return `Weekdays at ${time}`;
  if (days.join(",") === "0,6") return `Weekends at ${time}`;
  if (days.length === 1) return `Every ${WEEKDAY_NAMES[days[0] ?? 0]} at ${time}`;
  const names = days.map((day) => `${WEEKDAY_NAMES[day]}s`);
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]} at ${time}`;
}

/**
 * The days a weekday field selects, as sorted day numbers (Sunday is 0, and
 * 7 reads as Sunday like the scheduler treats it). Handles single days,
 * ranges (`1-5`), and lists of either (`2,4`, `1-3,5`). Anything fancier
 * (steps, names) returns null so the caller can fall back to the raw cron.
 */
function weekdaySet(field: string): number[] | null {
  const days = new Set<number>();
  for (const part of field.split(",")) {
    const range = part.match(/^(\d+)-(\d+)$/);
    if (range) {
      const lo = Number(range[1]);
      const hi = Number(range[2]);
      if (lo > 7 || hi > 7 || lo > hi) return null;
      for (let day = lo; day <= hi; day++) days.add(day % 7);
    } else if (/^\d+$/.test(part)) {
      const day = Number(part);
      if (day > 7) return null;
      days.add(day % 7);
    } else {
      return null;
    }
  }
  return [...days].sort((a, b) => a - b);
}

/**
 * Cron matching mirrored from the scheduler (`backend/src/schedules/cron.ts`)
 * so the next run shown here is the one the scheduler will actually fire:
 * same field syntax (lists, ranges, steps), same day-of-month/day-of-week
 * rule, same timezone handling. Keep the two in step.
 */
function expandCronField(field: string, min: number, max: number): Set<number> | null {
  if (field === "") return null;
  const out = new Set<number>();

  for (const part of field.split(",")) {
    if (part === "") return null;

    let range = part;
    let step = 1;
    const slash = part.indexOf("/");
    if (slash !== -1) {
      range = part.slice(0, slash);
      step = Number(part.slice(slash + 1));
      if (!Number.isInteger(step) || step <= 0) return null;
    }

    let lo: number;
    let hi: number;
    if (range === "*") {
      lo = min;
      hi = max;
    } else if (range.includes("-")) {
      const bounds = range.split("-");
      if (bounds.length !== 2) return null;
      lo = Number(bounds[0]);
      hi = Number(bounds[1]);
      if (!Number.isInteger(lo) || !Number.isInteger(hi)) return null;
    } else {
      lo = Number(range);
      if (!Number.isInteger(lo)) return null;
      hi = slash !== -1 ? max : lo;
    }

    if (lo < min || hi > max || lo > hi) return null;
    for (let v = lo; v <= hi; v += step) out.add(v);
  }

  return out;
}

interface ParsedCron {
  minute: Set<number>;
  hour: Set<number>;
  dom: Set<number>;
  month: Set<number>;
  dow: Set<number>;
  domRestricted: boolean;
  dowRestricted: boolean;
}

function parseCron(expr: string): ParsedCron | null {
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) return null;
  const [minuteField, hourField, domField, monthField, dowField] = fields as [string, string, string, string, string];

  const minute = expandCronField(minuteField, 0, 59);
  const hour = expandCronField(hourField, 0, 23);
  const dom = expandCronField(domField, 1, 31);
  const month = expandCronField(monthField, 1, 12);
  const dow = expandCronField(dowField, 0, 7);
  if (!minute || !hour || !dom || !month || !dow) return null;

  // Both 0 and 7 mean Sunday; normalize 7 to 0 (JS `Date.getDay()` style).
  if (dow.has(7)) dow.add(0);

  return {
    minute,
    hour,
    dom,
    month,
    dow,
    domRestricted: domField !== "*",
    dowRestricted: dowField !== "*",
  };
}

/** True if `cron` is a syntactically valid 5-field cron expression. */
export function isValidCron(cron: string): boolean {
  return parseCron(cron) !== null;
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number;
}

const zonedFormatters = new Map<string, Intl.DateTimeFormat>();

function zonedParts(date: Date, timeZone: string): ZonedParts {
  let formatter = zonedFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      weekday: "short",
    });
    zonedFormatters.set(timeZone, formatter);
  }
  const parts = formatter.formatToParts(date);
  const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    second: Number(get("second")),
    weekday: WEEKDAY_INDEX[get("weekday")] ?? date.getUTCDay(),
  };
}

/**
 * The zone a schedule's wall clock lives in, when the browser can know it:
 * the routine's own zone. A routine with no zone runs in the scheduler's
 * server-local time (the backend's `cronMatches` does the same), and the
 * server's zone is not exposed to the frontend, so there is no honest zone
 * to resolve to; substituting the viewer's zone would quietly disagree
 * with the server. An unknown zone name lands in the same place, because
 * the backend falls back to server local time for it. Null therefore means
 * no next run can be computed here.
 */
function resolveZone(timezone: string | null): string | null {
  if (!timezone) return null;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return timezone;
  } catch {
    return null;
  }
}

function cronMatchesAt(parsed: ParsedCron, date: Date, timeZone: string): boolean {
  const wc = zonedParts(date, timeZone);
  if (!parsed.minute.has(wc.minute)) return false;
  if (!parsed.hour.has(wc.hour)) return false;
  if (!parsed.month.has(wc.month)) return false;

  const domMatch = parsed.dom.has(wc.day);
  const dowMatch = parsed.dow.has(wc.weekday);

  // Vixie cron: when both day fields are restricted the day matches if
  // either does; otherwise a restricted field must match.
  if (parsed.domRestricted && parsed.dowRestricted) {
    return domMatch || dowMatch;
  }
  return domMatch && dowMatch;
}

/** Milliseconds the given zone is ahead of UTC at `instant`. */
function zoneOffsetMs(instant: number, timeZone: string): number {
  const wc = zonedParts(new Date(instant), timeZone);
  const asUtc = Date.UTC(wc.year, wc.month - 1, wc.day, wc.hour, wc.minute, wc.second);
  return asUtc - Math.floor(instant / 1000) * 1000;
}

/**
 * Every UTC instant whose wall clock in `timeZone` reads the given time:
 * exactly one normally, two when the time repeats at a fall-back switch,
 * none when it is skipped at a spring-forward switch. A single fixed-point
 * conversion can only ever land on one occurrence, and which one depends
 * on the offset beside the switch (and on the shift being one hour, which
 * Lord Howe's 30-minute shift is not). So sample the offsets in effect
 * around the time - real zones run from -12h to +14h, and a switch beside
 * this wall time sits inside that span - and keep the instants that read
 * back as the requested time.
 */
function zonedTimeOccurrences(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): number[] {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const offsets = new Set<number>();
  for (let probe = guess - 54_000_000; probe <= guess + 54_000_000; probe += 10_800_000) {
    offsets.add(zoneOffsetMs(probe, timeZone));
  }
  const occurrences: number[] = [];
  for (const offset of offsets) {
    const utc = guess - offset;
    const wc = zonedParts(new Date(utc), timeZone);
    if (
      wc.year === year &&
      wc.month === month &&
      wc.day === day &&
      wc.hour === hour &&
      wc.minute === minute &&
      !occurrences.includes(utc)
    ) {
      occurrences.push(utc);
    }
  }
  return occurrences.sort((a, b) => a - b);
}

/**
 * Next-run results by (cron, zone, start minute). Rows re-render on a
 * timer and the form re-renders per keystroke; without this, an
 * every-minute schedule rescans on every render. An entry is keyed on the
 * truncated start minute, so it is only ever reused inside the minute it
 * was computed for.
 */
const nextRunCache = new Map<string, Date | null>();

/**
 * The next instant `cron` fires at or after the current minute, following
 * the scheduler's own rules in the schedule's timezone; null when the
 * expression is invalid, when the schedule runs in the server's timezone
 * (which the browser cannot know), or when it never fires within four
 * years (February 30).
 */
export function nextRunAt(cron: string, timezone: string | null, from: Date = new Date()): Date | null {
  const parsed = parseCron(cron);
  if (!parsed) return null;
  const zone = resolveZone(timezone);
  if (!zone) return null;

  // The scheduler ticks on minute marks; the next run is the first matching
  // mark, counting the current minute when `from` sits exactly on it.
  let start = new Date(from);
  start.setSeconds(0, 0);
  if (start.getTime() < from.getTime()) start = new Date(start.getTime() + 60_000);
  const startMs = start.getTime();

  const key = `${cron}\n${zone}\n${startMs}`;
  const cached = nextRunCache.get(key);
  if (cached !== undefined) return cached ? new Date(cached.getTime()) : null;

  const result = scanNextRun(parsed, zone, startMs);
  if (nextRunCache.size >= 256) nextRunCache.clear();
  nextRunCache.set(key, result ? new Date(result.getTime()) : null);
  return result;
}

/** The day-by-day scan behind `nextRunAt`, uncached. */
function scanNextRun(parsed: ParsedCron, zone: string, startMs: number): Date | null {
  const hours = [...parsed.hour].sort((a, b) => a - b);
  const minutes = [...parsed.minute].sort((a, b) => a - b);

  const first = zonedParts(new Date(startMs), zone);
  // Start one wall day early: a fall-back switch at midnight reads as the
  // previous day again, so the next run can carry yesterday's date there.
  let cursor = Date.UTC(first.year, first.month - 1, first.day) - 86_400_000;
  // Four years of days covers the longest real gap (February 29).
  for (let dayOffset = 0; dayOffset <= 1467; dayOffset++) {
    const date = new Date(cursor);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const weekday = date.getUTCDay();

    if (parsed.month.has(month)) {
      const domMatch = parsed.dom.has(day);
      const dowMatch = parsed.dow.has(weekday);
      const dayMatches = parsed.domRestricted && parsed.dowRestricted ? domMatch || dowMatch : domMatch && dowMatch;
      if (dayMatches) {
        // The day's earliest instant wins, not the first in wall order:
        // beside a fall-back switch a later wall time can hold the earlier
        // instant (Berlin 2:45 CEST precedes the repeated 2:00 CET).
        let earliest: number | null = null;
        for (const hour of hours) {
          for (const minute of minutes) {
            const guess = Date.UTC(year, month - 1, day, hour, minute);
            // A wall time whose latest possible occurrence (zones run from
            // -12h to +14h) is already past cannot be next; skip it without
            // resolving its occurrences.
            if (guess + 43_200_000 < startMs) continue;
            for (const candidate of zonedTimeOccurrences(year, month, day, hour, minute, zone)) {
              if (candidate < startMs) continue;
              if (earliest !== null && candidate >= earliest) continue;
              if (cronMatchesAt(parsed, new Date(candidate), zone)) {
                earliest = candidate;
              }
            }
          }
        }
        if (earliest !== null) return new Date(earliest);
      }
    }
    cursor += 86_400_000;
  }
  return null;
}

/** The next run in plain words: "Tuesday at 9:00 AM", in the schedule's timezone. */
export function nextRunLabel(cron: string, timezone: string | null, from: Date = new Date()): string | null {
  const at = nextRunAt(cron, timezone, from);
  if (!at) return null;
  const zone = resolveZone(timezone);
  if (!zone) return null;
  const wc = zonedParts(at, zone);
  return `${WEEKDAY_NAMES[wc.weekday]} at ${clockLabel(wc.hour, wc.minute)}`;
}

export function scheduleZone(schedule: Pick<ScheduleRecord, "timezone">): string {
  return schedule.timezone ?? "Server timezone";
}

/** Wire shape from `GET /api/automations/:id/history`. */
export interface FiringRecord {
  id: string;
  schedule_id: string;
  run_id: string;
  fired_at: string;
  trigger: "cron" | "manual";
  /** Firing-time snapshot ("queued"). */
  status: string;
  /** Live run status, joined from the runs log; null if the run is gone. */
  run_status: string | null;
  run_summary: string | null;
}

/** Map a run status to a status-dot tone. */
export function runTone(status: string | null): DotTone {
  switch (status) {
    case "completed":
      return "success";
    case "failed":
      return "error";
    case "running":
      return "info";
    case "queued":
      return "away";
    default:
      return "neutral";
  }
}
