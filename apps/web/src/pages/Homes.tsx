import { useAuthStore } from "../stores/authStore";

export function Homes() {
  const { user } = useAuthStore();

  return (
    <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
      <h1>Welcome, {user?.displayName ?? "…"}</h1>
      <p>Homes list coming in Sprint 2.</p>
    </div>
  );
}
