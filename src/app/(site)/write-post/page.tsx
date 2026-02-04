import type { Metadata } from "next";
import { Suspense } from "react";

import WritePost from "./write-post";

export const metadata: Metadata = {
  title: "Write Post",
};

export default function WritePostPage() {
  return (
    <Suspense
      fallback={<div className="py-6 text-sm text-black/50">Loading…</div>}
    >
      <WritePost />
    </Suspense>
  );
}
