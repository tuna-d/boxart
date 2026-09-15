function parseDate(isoDate: string) {
  return new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
}

export function formatDate(isoDate: string) {
  return parseDate(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatMonthYear(isoDate: string) {
  return parseDate(isoDate).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function releaseYear(releaseDate: string | null) {
  return releaseDate ? releaseDate.slice(0, 4) : "TBA";
}

/** Short relative time for feeds: "4m ago", "3h ago", "2d ago", then a date. */
export function timeAgo(isoDateTime: string, now = Date.now()) {
  const minutes = Math.floor((now - new Date(isoDateTime).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(isoDateTime);
}
