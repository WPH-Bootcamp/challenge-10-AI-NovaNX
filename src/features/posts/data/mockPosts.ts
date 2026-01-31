export type MockPost = {
  id: string;
  title: string;
  excerpt: string;
  authorName: string;
  category: string;
  publishedAt: string;
  readTimeMinutes: number;
};

export const mockPosts: MockPost[] = [
  {
    id: "1",
    title: "Design-first Next.js Blog UI",
    excerpt:
      "Mulai dari layout, typography, spacing, dan komponen reusable agar integrasi API nanti tinggal plug-in.",
    authorName: "NovaNX",
    category: "Design",
    publishedAt: "2026-01-31",
    readTimeMinutes: 6,
  },
  {
    id: "2",
    title: "Membangun Article Card yang Konsisten",
    excerpt:
      "Kunci UI yang rapi: sistem komponen kecil (Card, Badge, Button) + container grid responsif.",
    authorName: "NovaNX",
    category: "UI",
    publishedAt: "2026-01-30",
    readTimeMinutes: 4,
  },
  {
    id: "3",
    title: "Loading State yang Enak Dilihat",
    excerpt:
      "Slicing bukan cuma tampilan final: skeleton/loading state bikin UI terasa cepat dan profesional.",
    authorName: "NovaNX",
    category: "UX",
    publishedAt: "2026-01-29",
    readTimeMinutes: 5,
  },
];
