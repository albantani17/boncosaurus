export type ZonedNow = { iso: string; offset: string; weekday: string };

const DEFAULT_TIME_ZONE = 'UTC';

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

// Formats `now` as a local ISO datetime with offset in the given IANA time zone.
export function describeZonedNow(now: Date, timeZone: string): ZonedNow {
  const zone = isValidTimeZone(timeZone) ? timeZone : DEFAULT_TIME_ZONE;
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
      timeZoneName: 'longOffset'
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value])
  );
  const offset = parts.timeZoneName === 'GMT' ? '+00:00' : String(parts.timeZoneName).replace('GMT', '');
  const weekday = new Intl.DateTimeFormat('id-ID', { timeZone: zone, weekday: 'long' }).format(now);

  return {
    iso: `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${offset}`,
    offset,
    weekday
  };
}
