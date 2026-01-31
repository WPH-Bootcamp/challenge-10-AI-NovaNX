import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

type ArticleCardProps = {
  id: string;
  title: string;
  excerpt: string;
  authorName: string;
  category: string;
  publishedAt: string;
  readTimeMinutes: number;
};

export function ArticleCard({
  id,
  title,
  excerpt,
  authorName,
  category,
  publishedAt,
  readTimeMinutes,
}: ArticleCardProps) {
  return (
    <article className="group rounded-2xl border border-black/10 bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <Badge>{category}</Badge>
        <p className="text-xs text-black/50">{publishedAt}</p>
      </div>

      <h3 className="mt-3 line-clamp-2 text-[18px] font-semibold leading-snug tracking-[-0.02em]">
        <Link
          href={`/posts/${id}`}
          className="outline-none focus:ring-2 focus:ring-black/10"
        >
          {title}
        </Link>
      </h3>

      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-black/65">
        {excerpt}
      </p>

      <div className="mt-5 flex items-center justify-between text-xs text-black/55">
        <span>By {authorName}</span>
        <span>{readTimeMinutes} min read</span>
      </div>

      <div className="mt-4 h-px w-full bg-black/5" />

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm font-medium text-black/80">Read more</span>
        <span className="text-black/40 transition group-hover:translate-x-0.5 group-hover:text-black/70">
          →
        </span>
      </div>
    </article>
  );
}
