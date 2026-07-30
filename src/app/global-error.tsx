"use client";

import { useEffect } from "react";

// Last-resort boundary: it replaces the root layout, so globals.css, the
// next/font variables, and the theme tokens are all gone. Everything here is
// inlined with the hex values from globals.css's dark palette.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(`Global error digest: ${error.digest ?? "n/a"}`);
  }, [error]);

  return (
    <html lang="en" style={{ backgroundColor: "#0a0a0f", color: "#e8e8f0" }}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          textAlign: "center",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>Something went wrong</h1>
          <p
            style={{
              margin: "12px auto 20px",
              maxWidth: "400px",
              fontSize: "14px",
              color: "#8888a0",
            }}
          >
            An unexpected error took the page down. It's usually temporary — try again.
          </p>
          {error.digest ? (
            <p
              style={{
                margin: "0 0 20px",
                fontFamily: "ui-monospace, monospace",
                fontSize: "12px",
                color: "#8888a0",
              }}
            >
              error code: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              backgroundColor: "#7c5cff",
              color: "#ffffff",
              border: 0,
              borderRadius: "8px",
              padding: "10px 20px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
