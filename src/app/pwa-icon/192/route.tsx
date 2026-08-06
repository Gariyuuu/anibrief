import { ImageResponse } from "next/og";

export async function GET() {
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
        }}
      >
        <div
          style={{
            width: 0,
            height: 0,
            borderTop: "40px solid transparent",
            borderBottom: "40px solid transparent",
            borderLeft: "68px solid #ea82a5",
          }}
        />
      </div>
    ),
    { width: 192, height: 192 }
  );
}
