import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import TokenProvider from "./components/TokenProvider";
import "./index.css";
import App from "./App.tsx";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function RootProviders({ children }: { children: React.ReactNode }) {
  // If Clerk is not configured, render without it so the app still works
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <TokenProvider>{children}</TokenProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <RootProviders>
        <App />
      </RootProviders>
    </BrowserRouter>
  </StrictMode>,
);
