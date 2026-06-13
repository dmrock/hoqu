import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0a0f",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          width: 116,
          height: 116,
          justifyContent: "space-between",
          alignContent: "space-between",
        }}
      >
        <div style={{ width: 52, height: 52, backgroundColor: "#7c5cff" }} />
        <div style={{ width: 52, height: 52, backgroundColor: "#00e5a0" }} />
        <div style={{ width: 52, height: 52, backgroundColor: "#ffa726" }} />
        <div style={{ width: 52, height: 52, backgroundColor: "#e8e8f0" }} />
      </div>
    </div>,
    size,
  );
}
