import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { HomesList } from "./pages/homes/HomesList";
import { HomeFormPage } from "./pages/homes/HomeFormPage";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";

// The map page pulls in MapLibre (~1 MB), so load it only when needed.
const HomeMap = lazy(() => import("./pages/homes/HomeMap"));

const protect = (element: ReactNode) => (
  <ProtectedRoute>
    <Suspense fallback={<p style={{ padding: "24px", fontFamily: "sans-serif" }}>Loading…</p>}>{element}</Suspense>
  </ProtectedRoute>
);

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/homes" replace /> },
  { path: "/login", element: <Login /> },
  { path: "/homes", element: protect(<HomesList />) },
  { path: "/homes/new", element: protect(<HomeFormPage />) },
  { path: "/homes/:homeId", element: protect(<HomeMap />) },
  { path: "/homes/:homeId/edit", element: protect(<HomeFormPage />) },
]);
