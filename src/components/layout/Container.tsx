import type { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  className?: string;
};

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={"mx-auto w-full max-w-107.5 px-4 " + (className ?? "")}>
      {children}
    </div>
  );
}
