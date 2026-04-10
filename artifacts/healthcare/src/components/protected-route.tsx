import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, accessToken } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !accessToken) {
      setLocation("/");
    } else if (!isLoading && user && allowedRoles && !allowedRoles.includes(user.role)) {
      setLocation(`/${user.role}/dashboard`);
    }
  }, [isLoading, accessToken, user, allowedRoles, setLocation]);

  if (isLoading || (!user && accessToken)) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-white/50" />
      </div>
    );
  }

  if (!accessToken || !user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}
