"use client";

import Link from "next/link";

import { Container } from "@/components/layout/Container";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main>
      <section className="py-10 sm:py-12">
        <Container>
          <div className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8">
            <h1 className="text-2xl font-semibold tracking-[-0.02em]">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-black/60">
              {error.message || "Terjadi error saat membuka detail artikel."}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => reset()}
                className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/90"
              >
                Try again
              </button>
              <Link
                href="/"
                className="rounded-xl bg-black/6 px-4 py-2 text-sm font-medium text-black transition hover:bg-black/9"
              >
                Go home
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
