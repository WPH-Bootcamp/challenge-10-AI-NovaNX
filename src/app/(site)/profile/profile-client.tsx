"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import { Container } from "@/components/layout/Container";
import { Input } from "@/components/ui/Input";
import { clearAuthToken } from "@/features/auth/token";
import { useAuthToken } from "@/features/auth/useAuthToken";
import { deletePost, getMyPosts } from "@/features/posts/api";
import { Badge } from "@/components/ui/Badge";
import {
  changePassword,
  getMyProfile,
  resolveBackendUrl,
  updateProfile,
  type ChangePasswordRequest,
} from "@/features/users/api";
import type { Post } from "@/types/blog";
import { ApiError } from "@/lib/api";
import { StatisticModal } from "@/features/posts/components/StatisticModal";
import { DeletePostModal } from "@/features/posts/components/DeletePostModal";
import type { PaginatedResponse } from "@/types/blog";

function looksLikeHtml(input: string) {
  return /<\/?[a-z][\s\S]*>/i.test(input);
}

function stripHtmlToText(input: string) {
  if (!input) return "";
  if (!looksLikeHtml(input)) return input;

  return input
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDateTimeId(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function tagsFromBackend(postTags: unknown): string[] {
  const raw = Array.isArray(postTags) ? postTags : [];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const t of raw) {
    const normalized = String(t ?? "").trim();
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function PostItem({
  post,
  onDelete,
  from,
}: {
  post: Post;
  onDelete: (post: Post) => void;
  from: string;
}) {
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const excerpt = stripHtmlToText(post.content).slice(0, 140);
  const created = formatDateTimeId(post.createdAt);
  const updated = formatDateTimeId(post.updatedAt ?? post.createdAt);
  const displayTags = tagsFromBackend(post.tags);

  return (
    <article className="border-b border-black/10 pb-5 last:border-b-0 last:pb-0">
      <h3 className="text-[16px] font-bold leading-snug text-black/90">
        <Link
          href={`/posts/${post.id}`}
          className="outline-none hover:underline focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:ring-offset-2"
        >
          {post.title}
        </Link>
      </h3>

      {displayTags.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {displayTags.slice(0, 6).map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      ) : null}

      <p className="mt-3 text-[13px] leading-relaxed text-black/60">
        {excerpt}
      </p>

      <p className="mt-3 text-[11px] text-black/45">
        Created {created}
        {updated ? ` | Last updated ${updated}` : ""}
      </p>

      <div className="mt-3 flex items-center gap-4 text-[12px] font-medium">
        <button
          type="button"
          className="text-sky-700 hover:underline"
          onClick={() => {
            setIsStatsOpen(true);
          }}
        >
          Statistic
        </button>

        <Link
          href={`/posts/${post.id}/edit?from=${encodeURIComponent(from)}`}
          className="text-sky-700 hover:underline"
        >
          Edit
        </Link>

        <button
          type="button"
          className="text-rose-600 hover:underline"
          onClick={() => {
            onDelete(post);
          }}
        >
          Delete
        </button>
      </div>

      {isStatsOpen ? (
        <StatisticModal
          isOpen={isStatsOpen}
          onClose={() => setIsStatsOpen(false)}
          postId={post.id}
          likesCount={post.likes}
          commentsCount={post.comments}
        />
      ) : null}
    </article>
  );
}

function PostItemDesktop({
  post,
  onDelete,
  from,
}: {
  post: Post;
  onDelete: (post: Post) => void;
  from: string;
}) {
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const excerpt = stripHtmlToText(post.content).slice(0, 140);
  const created = formatDateTimeId(post.createdAt);
  const updated = formatDateTimeId(post.updatedAt ?? post.createdAt);
  const displayTags = tagsFromBackend(post.tags);
  const coverSrc = post.imageUrl
    ? resolveBackendUrl(post.imageUrl)
    : "/images/blog-cover-placeholder.svg";

  return (
    <article className="grid grid-cols-[360px_1fr] gap-8 border-b border-[#D5D7DA] py-8 last:border-b-0">
      <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-black/5">
        <Image
          src={coverSrc}
          alt={post.title}
          fill
          sizes="360px"
          className="object-cover"
        />
      </div>

      <div className="min-w-0">
        <h3 className="text-[22px] font-semibold leading-snug tracking-[-0.02em] text-black/90">
          <Link
            href={`/posts/${post.id}`}
            className="outline-none hover:underline focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:ring-offset-2"
          >
            {post.title}
          </Link>
        </h3>

        {displayTags.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {displayTags.slice(0, 6).map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        ) : null}

        <p className="mt-4 line-clamp-2 text-[15px] leading-relaxed text-black/70">
          {excerpt}
        </p>

        <p className="mt-5 text-[12px] text-black/45">
          Created {created}
          {updated ? ` | Last updated ${updated}` : ""}
        </p>

        <div className="mt-6 flex items-center gap-5 text-[13px] font-medium">
          <button
            type="button"
            className="text-sky-700 hover:underline"
            onClick={() => setIsStatsOpen(true)}
          >
            Statistic
          </button>

          <Link
            href={`/posts/${post.id}/edit?from=${encodeURIComponent(from)}`}
            className="text-sky-700 hover:underline"
          >
            Edit
          </Link>

          <button
            type="button"
            className="text-rose-600 hover:underline"
            onClick={() => onDelete(post)}
          >
            Delete
          </button>
        </div>

        {isStatsOpen ? (
          <StatisticModal
            isOpen={isStatsOpen}
            onClose={() => setIsStatsOpen(false)}
            postId={post.id}
            likesCount={post.likes}
            commentsCount={post.comments}
          />
        ) : null}
      </div>
    </article>
  );
}

export default function ProfileClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const token = useAuthToken();
  const [activeTab, setActiveTab] = useState<"posts" | "password">("posts");

  const fromHref = useMemo(() => {
    const qs = searchParams.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [pathname, searchParams]);

  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [deleteError, setDeleteError] = useState<string>("");

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editHeadline, setEditHeadline] = useState("");
  const [editProfileMessage, setEditProfileMessage] = useState("");
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(
    null,
  );
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submittedPassword, setSubmittedPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string>("");

  const profileQuery = useQuery({
    queryKey: ["me", token],
    queryFn: async () => {
      if (!token) throw new Error("Unauthorized");
      return getMyProfile(token);
    },
    enabled: Boolean(token),
    staleTime: 0,
  });

  const myPostsQuery = useQuery({
    queryKey: ["my-posts", token],
    queryFn: async () => {
      if (!token) throw new Error("Unauthorized");
      return getMyPosts({ limit: 5, page: 1 }, token);
    },
    enabled: Boolean(token),
    staleTime: 0,
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (payload: ChangePasswordRequest) => {
      if (!token) throw new ApiError("Unauthorized", 401);
      return changePassword(payload, token);
    },
    onSuccess: (res) => {
      setPasswordMessage(res.message || "Password updated.");
      setSubmittedPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 401) {
        clearAuthToken();
        router.push("/login");
        router.refresh();
        return;
      }
      setPasswordMessage(
        err instanceof ApiError ? err.message : "Password updating failed.",
      );
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: {
      name?: string;
      headline?: string;
      avatar?: File;
    }) => {
      if (!token) throw new ApiError("Unauthorized", 401);
      return updateProfile(payload, token);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["me", token], updated);
      setEditProfileMessage("");
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 401) {
        clearAuthToken();
        router.push("/login");
        router.refresh();
        return;
      }
      setEditProfileMessage(
        err instanceof ApiError ? err.message : "Profile updating failed.",
      );
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      if (!token) throw new ApiError("Unauthorized", 401);
      return deletePost(postId, token);
    },
    onSuccess: (_res, postId) => {
      // Optimistic cache update so UI matches immediately.
      queryClient.setQueryData(
        ["my-posts", token],
        (prev: PaginatedResponse<Post> | undefined) => {
          if (!prev) return prev;
          const nextData = prev.data.filter((p) => p.id !== postId);
          return {
            ...prev,
            data: nextData,
            total: Math.max(0, (prev.total ?? nextData.length) - 1),
          };
        },
      );

      queryClient.invalidateQueries({ queryKey: ["my-posts", token] });
      setDeleteTarget(null);
      setDeleteError("");
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 401) {
        clearAuthToken();
        router.push("/login");
        router.refresh();
        return;
      }
      setDeleteError(err instanceof ApiError ? err.message : "Delete failed.");
    },
  });

  const currentPasswordError = useMemo(() => {
    if (!submittedPassword) return "";
    if (!currentPassword.trim()) return "this field cannot be empty";
    return "";
  }, [currentPassword, submittedPassword]);

  const newPasswordError = useMemo(() => {
    if (!submittedPassword) return "";
    if (!newPassword.trim()) return "this field cannot be empty";
    if (newPassword.trim().length < 8) return "minimum 8 characters";
    return "";
  }, [newPassword, submittedPassword]);

  const confirmPasswordError = useMemo(() => {
    if (!submittedPassword) return "";
    if (!confirmPassword.trim()) return "this field cannot be empty";
    if (confirmPassword.trim() !== newPassword.trim())
      return "password does not match";
    return "";
  }, [confirmPassword, newPassword, submittedPassword]);

  useEffect(() => {
    if (!isEditProfileOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsEditProfileOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isEditProfileOpen]);

  // Delete modal handles ESC + scroll lock.

  useEffect(() => {
    return () => {
      if (editAvatarPreview && editAvatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(editAvatarPreview);
      }
    };
  }, [editAvatarPreview]);

  if (!token) {
    return (
      <main>
        <section className="py-8">
          <Container>
            <div className="text-sm text-black/60">
              You are not logged in. Please log in first.
            </div>
          </Container>
        </section>
      </main>
    );
  }

  if (profileQuery.isLoading) {
    return (
      <main>
        <section className="py-8">
          <Container>
            <div className="text-sm text-black/60">Loading…</div>
          </Container>
        </section>
      </main>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <main>
        <section className="py-8">
          <Container>
            <div className="text-sm text-red-600">Failed to load profile.</div>
          </Container>
        </section>
      </main>
    );
  }

  const me = profileQuery.data;
  const avatar = me.avatarUrl ? resolveBackendUrl(me.avatarUrl) : null;
  const headline = me.headline ?? "";
  const posts = myPostsQuery.data?.data ?? [];

  const passwordForm = (
    <form
      className="mt-5 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmittedPassword(true);
        setPasswordMessage("");

        const curr = currentPassword.trim();
        const next = newPassword.trim();
        const conf = confirmPassword.trim();

        if (!curr || !next || !conf) return;
        if (next.length < 8) return;
        if (next !== conf) return;

        changePasswordMutation.mutate({
          currentPassword: curr,
          newPassword: next,
          confirmPassword: conf,
        });
      }}
    >
      <div className="space-y-2">
        <label className="text-[13px] font-semibold text-black/70">
          Current Password
        </label>
        <div className="relative">
          <Input
            id="profile-current-password"
            placeholder="Enter current password"
            type={showCurrent ? "text" : "password"}
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={
              (currentPasswordError
                ? "border-rose-500 focus:ring-rose-200 "
                : "") + "pr-12"
            }
          />
          <button
            type="button"
            aria-label={showCurrent ? "Hide password" : "Show password"}
            onClick={() => setShowCurrent((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-black/40 hover:bg-black/5 hover:text-black/60"
          >
            {showCurrent ? (
              <Image
                src="/icons/eye.svg"
                alt="Hide password"
                width={20}
                height={20}
                className="opacity-70"
              />
            ) : (
              <Image
                src="/icons/eye-off.svg"
                alt="Show password"
                width={20}
                height={20}
                className="opacity-70"
              />
            )}
          </button>
        </div>
        {currentPasswordError ? (
          <p className="text-xs text-rose-600">{currentPasswordError}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-[13px] font-semibold text-black/70">
          New Password
        </label>
        <div className="relative">
          <Input
            placeholder="Enter new password"
            type={showNew ? "text" : "password"}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={
              (newPasswordError ? "border-rose-500 focus:ring-rose-200 " : "") +
              "pr-12"
            }
          />
          <button
            type="button"
            aria-label={showNew ? "Hide password" : "Show password"}
            onClick={() => setShowNew((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-black/40 hover:bg-black/5 hover:text-black/60"
          >
            {showNew ? (
              <Image
                src="/icons/eye.svg"
                alt="Hide password"
                width={20}
                height={20}
                className="opacity-70"
              />
            ) : (
              <Image
                src="/icons/eye-off.svg"
                alt="Show password"
                width={20}
                height={20}
                className="opacity-70"
              />
            )}
          </button>
        </div>
        {newPasswordError ? (
          <p className="text-xs text-rose-600">{newPasswordError}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-[13px] font-semibold text-black/70">
          Confirm New Password
        </label>
        <div className="relative">
          <Input
            placeholder="Enter confirm new password"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={
              (confirmPasswordError
                ? "border-rose-500 focus:ring-rose-200 "
                : "") + "pr-12"
            }
          />
          <button
            type="button"
            aria-label={showConfirm ? "Hide password" : "Show password"}
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-black/40 hover:bg-black/5 hover:text-black/60"
          >
            {showConfirm ? (
              <Image
                src="/icons/eye.svg"
                alt="Hide password"
                width={20}
                height={20}
                className="opacity-70"
              />
            ) : (
              <Image
                src="/icons/eye-off.svg"
                alt="Show password"
                width={20}
                height={20}
                className="opacity-70"
              />
            )}
          </button>
        </div>
        {confirmPasswordError ? (
          <p className="text-xs text-rose-600">{confirmPasswordError}</p>
        ) : null}
      </div>

      {passwordMessage ? (
        <p
          className={
            "text-center text-xs " +
            (changePasswordMutation.isError
              ? "text-rose-600"
              : "text-emerald-700")
          }
        >
          {passwordMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={changePasswordMutation.isPending}
        className={
          "mt-2 h-12 w-full rounded-full bg-sky-600 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(2,132,199,0.25)] transition hover:bg-sky-700 " +
          (changePasswordMutation.isPending
            ? "cursor-not-allowed opacity-60"
            : "")
        }
      >
        {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
      </button>
    </form>
  );

  return (
    <main>
      {/* Mobile layout (<md) */}
      <section className="py-6 sm:py-8 md:hidden">
        <Container>
          <div className="space-y-5">
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full border border-black/10 bg-black/5">
                    <Image
                      src={avatar ?? "/icons/avatar-placeholder.svg"}
                      alt="Avatar"
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>

                  <div className="leading-tight">
                    <div className="text-[14px] font-semibold text-black/90">
                      {me.name}
                    </div>
                    <div className="text-[12px] text-black/55">
                      {headline || "Frontend Developer"}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="text-[12px] font-semibold text-sky-700 hover:underline"
                  onClick={() => {
                    setEditName(me.name ?? "");
                    setEditHeadline(me.headline ?? "");
                    setIsEditProfileOpen(true);
                  }}
                >
                  Edit Profile
                </button>
              </div>

              <div className="mt-4 flex items-center gap-6 border-b border-black/10">
                <button
                  type="button"
                  className={
                    "relative -mb-px px-1 py-3 text-[12px] font-semibold " +
                    (activeTab === "posts" ? "text-sky-700" : "text-black/45")
                  }
                  onClick={() => setActiveTab("posts")}
                >
                  Your Post
                  {activeTab === "posts" ? (
                    <span className="absolute bottom-0 left-0 h-[2px] w-full bg-sky-600" />
                  ) : null}
                </button>
                <button
                  type="button"
                  className={
                    "relative -mb-px px-1 py-3 text-[12px] font-semibold " +
                    (activeTab === "password"
                      ? "text-sky-700"
                      : "text-black/45")
                  }
                  onClick={() => setActiveTab("password")}
                >
                  Change Password
                  {activeTab === "password" ? (
                    <span className="absolute bottom-0 left-0 h-[2px] w-full bg-sky-600" />
                  ) : null}
                </button>
              </div>

              {activeTab === "posts" ? (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/write-post?from=${encodeURIComponent(fromHref)}`,
                    )
                  }
                  className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-sky-600 text-sm font-semibold text-white hover:bg-sky-600/90"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 20h9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Write Post
                </button>
              ) : (
                passwordForm
              )}
            </div>

            {activeTab === "posts" ? (
              <div>
                {myPostsQuery.isLoading ? (
                  <p className="mt-4 text-sm text-black/50">Loading…</p>
                ) : null}

                {myPostsQuery.isError ? (
                  <p className="mt-4 text-sm text-red-600">
                    Gagal memuat post.
                  </p>
                ) : null}

                {!myPostsQuery.isLoading &&
                !myPostsQuery.isError &&
                posts.length === 0 ? (
                  <div className="mt-10 flex flex-col items-center text-center">
                    <div className="relative">
                      <div className="absolute -left-3 -top-3 h-12 w-12 rounded-xl bg-sky-600" />
                      <div className="relative grid h-[140px] w-[140px] place-items-center rounded-2xl bg-sky-50">
                        <svg
                          width="86"
                          height="86"
                          viewBox="0 0 96 96"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                        >
                          <path
                            d="M26 10h34l16 16v60a6 6 0 0 1-6 6H26a6 6 0 0 1-6-6V16a6 6 0 0 1 6-6Z"
                            fill="#E0F2FE"
                            stroke="#0284C7"
                            strokeWidth="3"
                          />
                          <path
                            d="M60 10v16h16"
                            fill="#E0F2FE"
                            stroke="#0284C7"
                            strokeWidth="3"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M32 44h32"
                            stroke="#38BDF8"
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                          <path
                            d="M32 56h28"
                            stroke="#38BDF8"
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                          <path
                            d="M32 68h22"
                            stroke="#38BDF8"
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    </div>

                    <h3 className="mt-6 text-[14px] font-semibold text-black/80">
                      Your writing journey starts here
                    </h3>
                    <p className="mt-2 max-w-[260px] text-[12px] leading-relaxed text-black/45">
                      No posts yet, but every great writer starts with the first
                      one.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/write-post?from=${encodeURIComponent(fromHref)}`,
                        )
                      }
                      className="mt-8 inline-flex h-12 w-[220px] items-center justify-center gap-2 rounded-full bg-sky-600 text-sm font-semibold text-white hover:bg-sky-600/90"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          d="M12 20h9"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Write Post
                    </button>
                  </div>
                ) : null}

                {!myPostsQuery.isLoading &&
                !myPostsQuery.isError &&
                posts.length > 0 ? (
                  <>
                    <div className="text-[16px] font-semibold text-black/90">
                      {posts.length} Post
                    </div>

                    <div className="mt-4 space-y-5">
                      {posts.map((post) => (
                        <PostItem
                          key={post.id}
                          post={post}
                          onDelete={(p) => {
                            setDeleteError("");
                            setDeleteTarget(p);
                          }}
                          from={fromHref}
                        />
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </Container>
      </section>

      {/* Desktop layout (md+) */}
      <section className="hidden py-10 md:block lg:py-14">
        <div className="mx-auto w-full max-w-5xl px-4">
          <div className="space-y-8">
            <div className="mx-auto w-full max-w-3xl rounded-2xl border border-black/10 bg-white px-8 py-7">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full border border-black/10 bg-black/5">
                    <Image
                      src={avatar ?? "/icons/avatar-placeholder.svg"}
                      alt="Avatar"
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>

                  <div className="leading-tight">
                    <div className="text-[18px] font-semibold text-black/90">
                      {me.name}
                    </div>
                    <div className="mt-1 text-[14px] text-black/55">
                      {headline || "Frontend Developer"}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="text-[13px] font-semibold text-sky-700 hover:underline"
                  onClick={() => {
                    setEditName(me.name ?? "");
                    setEditHeadline(me.headline ?? "");
                    setIsEditProfileOpen(true);
                  }}
                >
                  Edit Profile
                </button>
              </div>
            </div>

            <div className="mx-auto w-full max-w-3xl border-b border-black/10">
              <div className="flex items-center justify-center gap-16">
                <button
                  type="button"
                  className={
                    "relative -mb-px px-1 py-4 text-[13px] font-semibold " +
                    (activeTab === "posts" ? "text-sky-700" : "text-black/45")
                  }
                  onClick={() => setActiveTab("posts")}
                >
                  Your Post
                  {activeTab === "posts" ? (
                    <span className="absolute bottom-0 left-0 h-[2px] w-full bg-sky-600" />
                  ) : null}
                </button>

                <button
                  type="button"
                  className={
                    "relative -mb-px px-1 py-4 text-[13px] font-semibold " +
                    (activeTab === "password"
                      ? "text-sky-700"
                      : "text-black/45")
                  }
                  onClick={() => setActiveTab("password")}
                >
                  Change Password
                  {activeTab === "password" ? (
                    <span className="absolute bottom-0 left-0 h-[2px] w-full bg-sky-600" />
                  ) : null}
                </button>
              </div>
            </div>

            {activeTab === "posts" ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#D5D7DA] pb-6">
                  <div className="text-[26px] font-semibold tracking-[-0.02em] text-black/90">
                    {posts.length} Post
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/write-post?from=${encodeURIComponent(fromHref)}`,
                      )
                    }
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-sky-600 px-10 text-sm font-semibold text-white hover:bg-sky-600/90"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 20h9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Write Post
                  </button>
                </div>

                {myPostsQuery.isLoading ? (
                  <p className="text-sm text-black/50">Loading…</p>
                ) : null}

                {myPostsQuery.isError ? (
                  <p className="text-sm text-red-600">Gagal memuat post.</p>
                ) : null}

                {!myPostsQuery.isLoading &&
                !myPostsQuery.isError &&
                posts.length === 0 ? (
                  <div className="pt-10 text-center text-sm text-black/60">
                    Belum ada post.
                  </div>
                ) : null}

                {!myPostsQuery.isLoading &&
                !myPostsQuery.isError &&
                posts.length > 0 ? (
                  <div>
                    {posts.map((post) => (
                      <PostItemDesktop
                        key={post.id}
                        post={post}
                        onDelete={(p) => {
                          setDeleteError("");
                          setDeleteTarget(p);
                        }}
                        from={fromHref}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mx-auto w-full max-w-md">{passwordForm}</div>
            )}
          </div>
        </div>
      </section>

      <DeletePostModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          setDeleteError("");
          deletePostMutation.mutate(deleteTarget.id);
        }}
        isPending={deletePostMutation.isPending}
        error={deleteError}
      />

      {isEditProfileOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Edit Profile"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsEditProfileOpen(false);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <h2 className="text-[14px] font-semibold text-black/90">
                Edit Profile
              </h2>
              <button
                type="button"
                aria-label="Close"
                className="rounded-lg p-2 text-black/50 hover:bg-black/5 hover:text-black/70"
                onClick={() => setIsEditProfileOpen(false)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="mt-5 flex justify-center">
              <div className="relative h-20 w-20 overflow-hidden rounded-full bg-black/5">
                <Image
                  src={
                    editAvatarPreview ??
                    avatar ??
                    "/icons/avatar-placeholder.svg"
                  }
                  alt="Avatar"
                  fill
                  sizes="80px"
                  className="object-cover"
                />
                <button
                  type="button"
                  aria-label="Change avatar"
                  className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full bg-sky-600 shadow-md"
                  onClick={() => {
                    setEditProfileMessage("");
                    avatarInputRef.current?.click();
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M9 7l1.2-2h3.6L15 7"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    // Reset input so selecting the same file again triggers onChange.
                    e.target.value = "";

                    const isValidType =
                      file.type === "image/jpeg" || file.type === "image/png";
                    if (!isValidType) {
                      setEditProfileMessage("Avatar must be JPG/PNG.");
                      return;
                    }

                    const maxBytes = 5 * 1024 * 1024;
                    if (file.size > maxBytes) {
                      setEditProfileMessage("Avatar max size is 5MB.");
                      return;
                    }

                    const previewUrl = URL.createObjectURL(file);
                    setEditAvatarPreview((prev) => {
                      if (prev && prev.startsWith("blob:"))
                        URL.revokeObjectURL(prev);
                      return previewUrl;
                    });

                    updateProfileMutation.mutate({ avatar: file });
                  }}
                />
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <label className="text-[12px] font-semibold text-black/70">
                  Name
                </label>
                <Input
                  value={editName}
                  placeholder="John Doe"
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => {
                    const next = editName.trim();
                    const prev = (me.name ?? "").trim();
                    if (!next || next === prev) return;
                    setEditProfileMessage("");
                    updateProfileMutation.mutate({ name: next });
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-semibold text-black/70">
                  Profile Headline
                </label>
                <Input
                  value={editHeadline}
                  placeholder="Frontend Developer"
                  onChange={(e) => setEditHeadline(e.target.value)}
                  onBlur={() => {
                    const next = editHeadline.trim();
                    const prev = (me.headline ?? "").trim();
                    if (next === prev) return;
                    setEditProfileMessage("");
                    updateProfileMutation.mutate({ headline: next });
                  }}
                />
              </div>

              <button
                type="button"
                className="mt-2 h-12 w-full rounded-full bg-sky-600 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(2,132,199,0.25)] transition hover:bg-sky-700"
                onClick={() => {
                  setIsEditProfileOpen(false);
                  setActiveTab("password");
                  setPasswordMessage("");
                  setSubmittedPassword(false);
                  setEditAvatarPreview(null);
                  window.setTimeout(() => {
                    document
                      .getElementById("profile-current-password")
                      ?.focus();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }, 50);
                }}
              >
                Update Password
              </button>

              {editProfileMessage ? (
                <p className="text-center text-xs text-rose-600">
                  {editProfileMessage}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
