"use client";
import { Button } from "@/components/ui/Button";
export default function ErrorBoundary({ reset }: { reset: () => void }) {
  return (
    <section
      role="alert"
      className="min-h-64 rounded-xl border border-border bg-card p-6"
    >
      <h2 className="text-xl font-semibold">
        Management Images could not be displayed
      </h2>
      <p className="my-4">
        Your last saved demo data is retained. Retry this screen.
      </p>
      <Button onClick={reset}>Retry</Button>
    </section>
  );
}
