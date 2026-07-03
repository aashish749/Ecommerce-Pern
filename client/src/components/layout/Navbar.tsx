import { Link } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  ClerkLoading,
  ClerkLoaded,
} from "@clerk/clerk-react";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "../../store/cartStore";
import { Button } from "../ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function ClerkAuth() {
  console.log("clerk key:", CLERK_KEY);
  if (!CLERK_KEY) return null;
  console.log("clerk key found:", CLERK_KEY);

  return (
    // We put a wrapper div with a fixed size to guarantee nothing shifts
    <div className="flex h-8 items-center justify-center min-w-[56px]">
      {/* 1. This shows your Shadcn skeleton ONLY while loading */}
      <ClerkLoading>
        <Skeleton className="h-7 w-7 rounded-full bg-gray-300" />
      </ClerkLoading>

      {/* 2. This loads the actual buttons once Clerk is ready */}
      <ClerkLoaded>
        <SignedOut>
          <SignInButton mode="modal">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </ClerkLoaded>
    </div>
  );
}

export default function Navbar() {
  const cartCount = useCartStore((state) => state.cartCount());

  return (
    <nav className="border-b">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-bold">
          Shop
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/products" className="text-sm font-medium hover:underline">
            Products
          </Link>

          <Link to="/cart" className="relative">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Link>

          <ClerkAuth />
        </div>
      </div>
    </nav>
  );
}
