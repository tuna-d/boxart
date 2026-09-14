import { ImageResponse } from "next/og";
import { colors, loadBrandFonts } from "./_brand/images";

export const alt = "Boxart: keep score of every game you play";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function heart(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7 6" shape-rendering="crispEdges"><path fill="${color}" d="M1 0h2v1H1zM4 0h2v1H4zM0 1h7v2H0zM1 3h5v1H1zM2 4h3v1H2zM3 5h1v1H3z"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default async function OpenGraphImage() {
  const fonts = await loadBrandFonts();

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: "72px 88px",
          background: colors.screen,
          borderBottom: `16px solid ${colors.accent}`,
          fontFamily: "IBM Plex Mono",
          position: "relative",
        }}
      >
        {/* Scanlines, one faint line every four pixels like the site. */}
        <div style={{ display: "flex", flexDirection: "column", position: "absolute", inset: 0 }}>
          {Array.from({ length: 158 }, (_, index) => (
            <div
              key={index}
              style={{ height: 1, marginBottom: 3, background: "rgba(255, 255, 255, 0.035)" }}
            />
          ))}
        </div>

        <div style={{ display: "flex", fontFamily: "Silkscreen", fontSize: 30, color: colors.p2 }}>
          &gt; Press start
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 36,
            fontFamily: "Silkscreen",
            fontSize: 190,
            lineHeight: 1,
            letterSpacing: 4,
            color: colors.accent,
            textShadow: `10px 10px 0 ${colors.shade}`,
          }}
        >
          BOXART
        </div>
        <div style={{ display: "flex", marginTop: 40, fontSize: 44, color: colors.ink }}>
          Keep score of every game you play
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 40, marginTop: "auto" }}>
          <div style={{ display: "flex", gap: 12 }}>
            {[colors.p1, colors.p1, colors.p1, colors.p1, colors.line].map((color, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={index} src={heart(color)} width={56} height={48} alt="" />
            ))}
          </div>
          <div style={{ display: "flex", fontFamily: "Silkscreen", fontSize: 28, color: colors.inkSoft }}>
            Log · Rate · Review · List
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
