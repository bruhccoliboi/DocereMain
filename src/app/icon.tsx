import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a09",
          borderRadius: 8,
          border: "2px solid #6b7c5e",
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 700, color: "#6b7c5e" }}>D</span>
      </div>
    ),
    { ...size },
  );
}
