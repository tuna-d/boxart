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
