/** Parses a numeric row id from a URL or form field, or returns null when it is not one. */
export function parseId(value: unknown) {
  if (typeof value !== "string" || !/^[1-9]\d{0,15}$/.test(value)) return null;
  return Number(value);
}
