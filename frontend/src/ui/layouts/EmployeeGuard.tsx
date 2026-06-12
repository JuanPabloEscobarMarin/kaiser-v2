import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/ui/hooks/useAuth";

export function EmployeeGuard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "EMPLOYEE") return <Navigate to="/" replace />;

  return <Outlet />;
}
