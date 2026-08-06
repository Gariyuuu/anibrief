import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#18140f",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 0,
            height: 0,
            borderTop: "36px solid #2a241c",
            borderLeft: "36px solid transparent",
          }}
        />
        <div
          style={{
            width: 0,
            height: 0,
            borderTop: "38px solid transparent",
            borderBottom: "38px solid transparent",
            borderLeft: "64px solid #ea82a5",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
