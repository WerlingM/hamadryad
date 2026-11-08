import type { ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { HomesList } from "./pages/homes/HomesList";
import { HomeDetail } from "./pages/homes/HomeDetail";
import { HomeFormPage } from "./pages/homes/HomeFormPage";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";

const protect = (element: ReactNode) => <ProtectedRoute>{element}</ProtectedRoute>;

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/homes" replace /> },
  { path: "/login", element: <Login /> },
  { path: "/homes", element: protect(<HomesList />) },
  { path: "/homes/new", element: protect(<HomeFormPage />) },
  { path: "/homes/:homeId", element: protect(<HomeDetail />) },
  { path: "/homes/:homeId/edit", element: protect(<HomeFormPage />) },
]);
