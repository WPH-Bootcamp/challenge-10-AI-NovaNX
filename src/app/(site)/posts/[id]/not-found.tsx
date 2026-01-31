import Link from "next/link";

import { Container } from "@/components/layout/Container";

export default function NotFound() {
  return (
    <main>
      <section className="py-10 sm:py-12">
        <Container>
          <div className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8">
            <h1 className="text-2xl font-semibold tracking-[-0.02em]">
              Post not found
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-black/60">
              Artikel yang kamu cari tidak ditemukan. Coba kembali ke homepage.
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/90"
              >
                Back to home
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
