import Link from "next/link";
import { SiteNav } from "@/components/site-nav";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-start justify-center px-6 pb-36">
      <h1 className="text-2xl font-medium tracking-tight">Page not found</h1>
      <p className="mt-2 text-muted">
        This page doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-6 text-sm text-link hover:text-foreground"
      >
        ← Back home
      </Link>

      <SiteNav items={[{ label: "Ask anything", ask: true }]} back="/" />
    </main>
  );
}
