import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { row } from "../ui/styles";

interface PageLayoutProps {
  title: string;
  actions?: ReactNode;
  back?: { to: string; label: string };
  children: ReactNode;
}

export function PageLayout({ title, actions, back, children }: PageLayoutProps) {
  const { user } = useAuthStore();

  return (
    <div style={{ fontFamily: "sans-serif", minHeight: "100vh", background: "#f6f7f4" }}>
      <header
        style={{ ...row, justifyContent: "space-between", padding: "12px 24px", background: "#2f6b3a", color: "#fff" }}
      >
        <Link to="/homes" style={{ color: "#fff", textDecoration: "none", fontWeight: "bold" }}>
          Hamadryad
        </Link>
        <span>{user?.displayName}</span>
      </header>
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
        {back && (
          <Link to={back.to} style={{ display: "inline-block", marginBottom: "8px" }}>
            ← {back.label}
          </Link>
        )}
        <div style={{ ...row, justifyContent: "space-between", marginBottom: "16px" }}>
          <h1 style={{ margin: 0 }}>{title}</h1>
          {actions && <div style={row}>{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  );
}
