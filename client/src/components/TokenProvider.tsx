import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { setTokenGetter } from "../api/axios";

export default function TokenProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getToken } = useAuth();

  useEffect(() => {
    setTokenGetter(() => getToken());
  }, [getToken]);

  return <>{children}</>;
}
