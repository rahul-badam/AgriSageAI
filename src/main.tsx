import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.tsx";
import "./index.css";

const env = import.meta.env as Record<string, string | undefined>;
const clerkPublishableKey =
  env.VITE_CLERK_PUBLISHABLE_KEY ??
  env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
  "pk_test_bWlnaHR5LWdob3N0LTgwLmNsZXJrLmFjY291bnRzLmRldiQ";

if (!clerkPublishableKey) {
  throw new Error("Missing Clerk publishable key. Set VITE_CLERK_PUBLISHABLE_KEY in .env.local");
}

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={clerkPublishableKey}>
    <App />
  </ClerkProvider>,
);
