export function dateOnly(input: Date | string) {
  const date = typeof input === "string" ? new Date(input) : input;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function parseFormDate(value: FormDataEntryValue | null, fallback?: Date) {
  if (!value || typeof value !== "string") {
    return fallback ?? dateOnly(new Date());
  }

  return dateOnly(`${value}T00:00:00.000Z`);
}

export function formatDate(input: Date | string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(typeof input === "string" ? new Date(input) : input);
}

export function htmlDate(input: Date | string) {
  const date = typeof input === "string" ? new Date(input) : input;
  return date.toISOString().slice(0, 10);
}

export function daysBetweenInclusive(start: Date, end: Date) {
  const startTime = dateOnly(start).getTime();
  const endTime = dateOnly(end).getTime();
  const days = Math.floor((endTime - startTime) / 86_400_000) + 1;
  return Math.max(days, 1);
}

export function enumerateDays(start: Date, end: Date) {
  const total = daysBetweenInclusive(start, end);
  return Array.from({ length: total }, (_, index) => {
    const day = dateOnly(start);
    day.setUTCDate(day.getUTCDate() + index);
    return day;
  });
}
