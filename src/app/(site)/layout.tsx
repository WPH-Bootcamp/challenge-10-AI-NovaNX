import type { ReactNode } from "react";
import { Suspense } from "react";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

type SiteLayoutProps = {
  children: ReactNode;
};

export default function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <Suspense fallback={<div className="h-16 w-full" />}>
        <Header />
      </Suspense>
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
