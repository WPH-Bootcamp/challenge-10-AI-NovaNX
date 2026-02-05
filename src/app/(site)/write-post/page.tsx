import type { Metadata } from "next";
import { Suspense } from "react";

import { PostEditorForm } from "@/features/posts/components/PostEditorForm";

export const metadata: Metadata = {
  title: "Write Post",
};

export default function WritePostPage() {
  return (
    <Suspense
      fallback={
        <main>
          <section className="py-6 text-sm text-black/50 md:hidden">
            <div className="px-6">Loading…</div>
          </section>
          <section className="hidden py-8 text-sm text-black/50 md:block">
            <div className="w-full px-6 md:px-10 lg:px-12">Loading…</div>
          </section>
        </main>
      }
    >
      <PostEditorForm mode="create" />
    </Suspense>
  );
}
