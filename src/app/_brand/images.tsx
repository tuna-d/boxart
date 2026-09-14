import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const colors = {
  screen: "#0d0c11",
  ink: "#efeae0",
  inkSoft: "#cfc9bc",
  muted: "#8f897d",
  line: "#3a3544",
  accent: "#ffd23f",
  p1: "#ff5a4e",
  p2: "#49d8f2",
  shade: "#3a2a55",
};

/** The pixel "B" used by the favicon, one string per row. */
const B_GLYPH = ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."];

export async function loadBrandFonts() {
  const directory = join(process.cwd(), "src/app/_fonts");
  const [pixel, mono] = await Promise.all([
    readFile(join(directory, "Silkscreen-Regular.ttf")),
    readFile(join(directory, "IBMPlexMono-Medium.ttf")),
  ]);
  return [
    { name: "Silkscreen", data: pixel, weight: 400 as const, style: "normal" as const },
    { name: "IBM Plex Mono", data: mono, weight: 500 as const, style: "normal" as const },
  ];
}

/** Draws the pixel "B" with its drop shadow, sized to fit a square of the given size. */
export function PixelB({ size }: { size: number }) {
  const unit = Math.floor(size / 10);
  const offsetX = Math.floor((size - unit * 5) / 2) - Math.floor(unit / 4);
  const offsetY = Math.floor((size - unit * 7) / 2) - Math.floor(unit / 4);
  const shadow = Math.max(Math.floor(unit / 2), 1);
  const cells = B_GLYPH.flatMap((row, y) =>
    [...row].flatMap((cell, x) => (cell === "#" ? [{ x, y }] : [])),
  );

  return (
    <div style={{ display: "flex", position: "relative", width: size, height: size, background: colors.screen }}>
      {[
        { color: colors.shade, shift: shadow },
        { color: colors.accent, shift: 0 },
      ].flatMap((layer) =>
        cells.map((cell) => (
          <div
            key={`${layer.color}-${cell.x}-${cell.y}`}
            style={{
              position: "absolute",
              left: offsetX + cell.x * unit + layer.shift,
              top: offsetY + cell.y * unit + layer.shift,
              width: unit,
              height: unit,
              background: layer.color,
            }}
          />
        )),
      )}
    </div>
  );
}
