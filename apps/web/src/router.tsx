import { createBrowserRouter, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { Homes } from "./pages/Homes";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/homes" replace />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/homes",
    element: (
      <ProtectedRoute>
        <Homes />
      </ProtectedRoute>
    ),
  },
]);
