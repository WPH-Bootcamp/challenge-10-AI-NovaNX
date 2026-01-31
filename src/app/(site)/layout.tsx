import type { ReactNode } from "react";

import { Header } from "@/components/layout/Header";

type SiteLayoutProps = {
  children: ReactNode;
};

export default function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Header />
      {children}
    </div>
  );
}
