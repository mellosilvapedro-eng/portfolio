import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-start justify-center px-6">
      <h1 className="text-2xl font-medium tracking-tight">Page not found</h1>
      <p className="mt-2 text-muted">
        This page doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-6 text-sm underline decoration-border underline-offset-4 transition-colors duration-150 hover:text-foreground hover:decoration-foreground"
      >
        ← Back home
      </Link>
    </main>
  );
}
