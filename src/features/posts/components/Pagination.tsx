import { Button } from "@/components/ui/Button";

type PaginationProps = {
  page: number;
  totalPages: number;
};

export function Pagination({ page, totalPages }: PaginationProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Button variant="ghost" disabled={page <= 1}>
        Prev
      </Button>

      <p className="text-sm text-black/60">
        Page <span className="font-medium text-black">{page}</span> of{" "}
        <span className="font-medium text-black">{totalPages}</span>
      </p>

      <Button variant="ghost" disabled={page >= totalPages}>
        Next
      </Button>
    </div>
  );
}
