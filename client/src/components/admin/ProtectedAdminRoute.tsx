import { useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export default function ProtectedAdminRoute({
  children,
}: ProtectedAdminRouteProps) {
  const { isLoaded, isSignedIn, user } = useUser();

  // While Clerk is loading, show a spinner
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not signed in → redirect to home
  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  // Check public metadata for admin role
  const role = user?.publicMetadata?.role;
  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
