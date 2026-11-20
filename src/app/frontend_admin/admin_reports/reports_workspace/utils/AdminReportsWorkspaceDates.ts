export function localDay(value: string | Date, timeZone = "Asia/Kolkata") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const part = (name: string) => parts.find((p) => p.type === name)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function dateRange(preset: string, now = new Date()) {
  const end = localDay(now),
    anchor = new Date(`${end}T12:00:00Z`);
  if (preset === "week")
    anchor.setUTCDate(anchor.getUTCDate() - ((anchor.getUTCDay() + 6) % 7));
  if (preset === "month") anchor.setUTCDate(1);
  return {
    from: preset === "all" ? "" : anchor.toISOString().slice(0, 10),
    to: preset === "all" ? "" : end,
  };
}
export function inRange(at: string, from: string, to: string) {
  const day = localDay(at);
  return (!from || day >= from) && (!to || day <= to);
}
