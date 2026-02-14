import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

<<<<<<< Updated upstream
createRoot(document.getElementById("root")!).render(<App />);
=======
const env = import.meta.env as Record<string, string | undefined>;
const clerkPublishableKey = env.VITE_CLERK_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const root = createRoot(document.getElementById("root")!);

if (!clerkPublishableKey) {
  root.render(
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <section className="max-w-xl w-full rounded-xl border border-border bg-card p-6 shadow">
        <h1 className="text-xl font-semibold mb-3">Authentication setup required</h1>
        <p className="text-sm text-muted-foreground mb-2">
          Missing Clerk publishable key.
        </p>
        <p className="text-sm text-muted-foreground">
          Add <code>VITE_CLERK_PUBLISHABLE_KEY</code> to <code>.env.local</code>, then restart the frontend server.
        </p>
      </section>
    </main>,
  );
} else {
  root.render(
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <App />
    </ClerkProvider>,
  );
}
>>>>>>> Stashed changes
