const tones = ["#22404d", "#3b2a4d", "#4a2f24", "#233d2e", "#2d3350", "#4a2438"];

/** Picks a stable dark background for things that have no image yet. */
export function toneFor(text: string) {
  let hash = 0;
  for (const char of text) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return tones[hash % tones.length];
}
