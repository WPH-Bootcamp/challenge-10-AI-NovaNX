import { Input } from "@/components/ui/Input";

type SearchBarProps = {
  placeholder?: string;
};

export function SearchBar({
  placeholder = "Search articles...",
}: SearchBarProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/30">
        ⌕
      </span>
      <Input className="pl-10" placeholder={placeholder} />
    </div>
  );
}
