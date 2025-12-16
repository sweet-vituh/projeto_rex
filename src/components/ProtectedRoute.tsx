import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("pcm" | "mechanic" | "admin")[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    // If not authenticated, redirect to login
    if (!user) {
      navigate("/", { replace: true });
      return;
    }

    // If no role found (user has no entry in user_roles), redirect to login
    if (!role) {
      navigate("/", { replace: true });
      return;
    }

    // If specific roles are required and user doesn't have one of them
    if (allowedRoles && !allowedRoles.includes(role as "pcm" | "mechanic" | "admin")) {
      // Redirect to the appropriate home based on their actual role
      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else if (role === "pcm") {
        navigate("/inbox", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    }
  }, [user, role, isLoading, allowedRoles, navigate]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  // Don't render children if not authorized
  if (!user || !role) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(role as "pcm" | "mechanic" | "admin")) {
    return null;
  }

  return <>{children}</>;
}
