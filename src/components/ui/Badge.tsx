type BadgeProps = {
  children: string;
};

export function Badge({ children }: BadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-black/10 bg-black/4 px-2.5 py-1 text-xs font-medium text-black/70">
      {children}
    </span>
  );
}
