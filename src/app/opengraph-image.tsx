import { ImageResponse } from "next/og";

export const alt = "HOQU — gamified hobby tracker for movies, TV shows, games, and books";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Pulls the subsetted Press Start 2P TTF from Google Fonts at build time; the
// image falls back to the default sans if the network is unavailable.
async function loadPixelFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(
        `https://fonts.googleapis.com/css2?family=Press+Start+2P&text=${encodeURIComponent(text)}`,
      )
    ).text();
    const resource = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/);
    if (!resource) return null;
    const res = await fetch(resource[1]);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const title = "HOQU";
  const fontData = await loadPixelFont(title);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
        backgroundColor: "#0a0a0f",
        color: "#e8e8f0",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          width: 120,
          height: 120,
          justifyContent: "space-between",
          alignContent: "space-between",
        }}
      >
        <div style={{ width: 54, height: 54, backgroundColor: "#7c5cff" }} />
        <div style={{ width: 54, height: 54, backgroundColor: "#00e5a0" }} />
        <div style={{ width: 54, height: 54, backgroundColor: "#ffa726" }} />
        <div style={{ width: 54, height: 54, backgroundColor: "#e8e8f0" }} />
      </div>
      <div
        style={{
          fontSize: 88,
          fontWeight: 700,
          fontFamily: fontData ? "Press Start 2P" : undefined,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 34, color: "#8888a0" }}>
        Gamified hobby tracker for movies, TV, games &amp; books
      </div>
    </div>,
    {
      ...size,
      fonts: fontData
        ? [{ name: "Press Start 2P", data: fontData, style: "normal", weight: 400 }]
        : undefined,
    },
  );
}
