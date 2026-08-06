import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "#0c0c10",
          padding: "80px",
          color: "#ece9e4",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 36 }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 18,
              background: "#18140f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderTop: "18px solid transparent",
                borderBottom: "18px solid transparent",
                borderLeft: "30px solid #ea82a5",
              }}
            />
          </div>
          <div style={{ display: "flex", fontSize: 56, fontWeight: 700, letterSpacing: -1 }}>
            <span>Ani</span>
            <span style={{ color: "#ea82a5" }}>Brief</span>
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#94907f", maxWidth: 820 }}>
          Your daily briefing for anime, manga, music, and more.
        </div>
      </div>
    ),
    { ...size }
  );
}
