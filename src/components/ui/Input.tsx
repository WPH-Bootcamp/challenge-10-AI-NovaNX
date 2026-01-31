import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={
        "h-11 w-full rounded-xl border border-black/10 bg-white px-4 text-sm outline-none placeholder:text-black/40 focus:ring-2 focus:ring-black/10 " +
        (className ?? "")
      }
      {...props}
    />
  );
}
