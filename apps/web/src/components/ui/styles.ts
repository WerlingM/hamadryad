import type { CSSProperties } from "react";

// Minimal shared inline styles until a design system is introduced.
export const input: CSSProperties = {
  display: "block",
  width: "100%",
  padding: "8px",
  marginTop: "4px",
  boxSizing: "border-box",
  font: "inherit",
};

export const field: CSSProperties = { display: "block", marginBottom: "12px" };

export const button: CSSProperties = {
  padding: "8px 14px",
  border: "1px solid #888",
  borderRadius: "4px",
  background: "#fff",
  cursor: "pointer",
  font: "inherit",
};

export const primaryButton: CSSProperties = {
  ...button,
  background: "#2f6b3a",
  borderColor: "#2f6b3a",
  color: "#fff",
};

export const dangerButton: CSSProperties = { ...button, borderColor: "#a33", color: "#a33" };

export const card: CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: "6px",
  padding: "16px",
  marginBottom: "12px",
  background: "#fff",
};

export const row: CSSProperties = { display: "flex", gap: "8px", alignItems: "center" };

export const muted: CSSProperties = { color: "#666", margin: "4px 0" };

export const errorText: CSSProperties = { color: "#a33", margin: "8px 0" };
