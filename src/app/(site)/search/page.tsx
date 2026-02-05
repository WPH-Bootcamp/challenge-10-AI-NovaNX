import { Suspense } from "react";

import SearchClientPage from "./search-client";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="h-[calc(100dvh-64px)] w-full" />}>
      <SearchClientPage />
    </Suspense>
  );
}
