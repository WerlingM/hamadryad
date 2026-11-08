import { Link } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { row } from "../ui/styles";

export function AppHeader() {
  const { user } = useAuthStore();

  return (
    <header
      style={{ ...row, justifyContent: "space-between", padding: "12px 24px", background: "#2f6b3a", color: "#fff" }}
    >
      <Link to="/homes" style={{ color: "#fff", textDecoration: "none", fontWeight: "bold" }}>
        Hamadryad
      </Link>
      <span>{user?.displayName}</span>
    </header>
  );
}
