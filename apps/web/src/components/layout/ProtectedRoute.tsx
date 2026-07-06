import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

type AuthState = "checking" | "authenticated" | "unauthenticated";

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { token, setAuth } = useAuthStore();
  const [authState, setAuthState] = useState<AuthState>(
    token ? "authenticated" : "checking"
  );

  useEffect(() => {
    if (token) {
      setAuthState("authenticated");
      return;
    }

    let cancelled = false;

    fetch("/auth/refresh", { method: "POST", credentials: "include" })
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setAuthState("unauthenticated");
          return;
        }
        const { token: newToken } = (await res.json()) as { token: string };

        // Fetch user details with the new token directly to avoid circular
        // dependency between ProtectedRoute → apolloClient → authStore.
        const meRes = await fetch("/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${newToken}`,
          },
          body: JSON.stringify({ query: "{ me { id email displayName } }" }),
        });

        const meData = (await meRes.json()) as {
          data?: {
            me: { id: string; email: string; displayName: string } | null;
          };
        };

        if (cancelled) return;

        const me = meData.data?.me;
        if (!me) {
          setAuthState("unauthenticated");
          return;
        }

        setAuth(newToken, me);
        setAuthState("authenticated");
      })
      .catch(() => {
        if (!cancelled) setAuthState("unauthenticated");
      });

    return () => {
      cancelled = true;
    };
  }, [token, setAuth]);

  if (authState === "checking") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "sans-serif",
        }}
      >
        Loading…
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
