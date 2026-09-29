import Link from "next/link";
import { AmbientBackground } from "@/components/motion";

// Shown for any URL that doesn't exist.
export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <AmbientBackground />
      <div className="glass max-w-md rounded-[22px] p-8 text-center">
        <h1 className="text-2xl font-semibold">This page doesn&apos;t exist</h1>
        <p className="mt-2 text-sm text-slate">The link may be old or mistyped. Head back to your overview to keep going.</p>
        <Link href="/dashboard" className="clay-primary focus-ring mt-6 inline-flex h-11 items-center rounded-2xl px-5 text-sm font-semibold">
          Go to overview
        </Link>
      </div>
    </main>
  );
}
