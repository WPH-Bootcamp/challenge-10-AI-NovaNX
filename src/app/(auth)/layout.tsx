import type { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return <div className="min-h-dvh bg-[#F6F7FB]">{children}</div>;
}
