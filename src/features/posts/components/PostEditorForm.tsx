"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { useMutation } from "@tanstack/react-query";

import { Container } from "@/components/layout/Container";
import { Input } from "@/components/ui/Input";
import { useAuthToken } from "@/features/auth/useAuthToken";
import { createPost, updatePost } from "@/features/posts/api";
import { resolveBackendUrl } from "@/features/users/api";
import { ApiError } from "@/lib/api";
import type { Post } from "@/types/blog";

type IconButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  children: React.ReactNode;
};

function IconButton({
  label,
  onClick,
  disabled,
  pressed,
  children,
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-black/70 transition " +
        (pressed
          ? "bg-black/7 text-black"
          : "hover:bg-black/5 hover:text-black/90 ") +
        (disabled ? "opacity-40 pointer-events-none" : "")
      }
    >
      {children}
    </button>
  );
}

function SvgIcon({
  children,
  viewBox = "0 0 24 24",
}: {
  children: React.ReactNode;
  viewBox?: string;
}) {
  return (
    <svg
      width="18"
      height="18"
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="text-current"
    >
      {children}
    </svg>
  );
}

const HEADING_OPTIONS = [
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
] as const;

type HeadingValue = (typeof HEADING_OPTIONS)[number]["value"] | "paragraph";

type Props = {
  mode: "create" | "edit";
  postId?: number;
  initialPost?: Post;
};

const AVAILABLE_TAGS = ["Programming", "Frontend", "Coding"] as const;
type AvailableTag = (typeof AVAILABLE_TAGS)[number];
const CANONICAL_TAG_BY_LOWER = new Map<string, AvailableTag>(
  AVAILABLE_TAGS.map((t) => [t.toLowerCase(), t]),
);

function normalizeBackendTagsToChips(rawTags: unknown): string[] {
  if (!Array.isArray(rawTags)) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of rawTags) {
    const original = String(raw ?? "").trim();
    if (!original) continue;

    const lower = original.toLowerCase();

    const direct = CANONICAL_TAG_BY_LOWER.get(lower);
    if (direct) {
      const key = direct.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(direct);
      }
      continue;
    }

    // Handle concatenated / combined tags by extracting known tags in order.
    const extracted = AVAILABLE_TAGS.map((t) => {
      const idx = lower.indexOf(t.toLowerCase());
      return { tag: t, idx };
    })
      .filter((x) => x.idx >= 0)
      .sort((a, b) => a.idx - b.idx)
      .map((x) => x.tag);

    if (extracted.length) {
      for (const t of extracted) {
        const key = t.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(t);
        if (result.length >= 3) return result;
      }
      continue;
    }

    // Fallback: keep backend tag as-is (shown in edit), user may remove it.
    const key = lower;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(original);
    if (result.length >= 3) return result;
  }

  return result;
}

export function PostEditorForm({ mode, postId, initialPost }: Props) {
  const toolbarId = useId();
  const fileInputId = useId();
  const coverInputId = useId();
  const router = useRouter();
  const token = useAuthToken();

  const isEditing = mode === "edit";

  const [title, setTitle] = useState(() => initialPost?.title ?? "");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [headingValue, setHeadingValue] = useState<HeadingValue>("paragraph");

  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [isCoverDragging, setIsCoverDragging] = useState(false);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const coverObjectUrlRef = useRef<string | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(
    () => initialPost?.imageUrl ?? null,
  );
  const [removeExistingCover, setRemoveExistingCover] = useState(false);
  const [tags, setTags] = useState<string[]>(() =>
    normalizeBackendTagsToChips(initialPost?.tags ?? []),
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  function isEditorDocumentEmpty(editorInstance: Editor) {
    const json = editorInstance.getJSON() as {
      type?: string;
      content?: Array<{
        type?: string;
        content?: Array<{ type?: string; text?: string }>;
      }>;
    };

    const docContent = json?.content;
    if (!Array.isArray(docContent) || docContent.length === 0) return true;
    if (docContent.length !== 1) return false;

    const firstNode = docContent[0];
    if (firstNode?.type !== "paragraph") return false;

    const paragraphContent = firstNode.content;
    if (!Array.isArray(paragraphContent) || paragraphContent.length === 0)
      return true;

    return paragraphContent.every((node) => {
      if (node?.type !== "text") return false;
      return !(node.text ?? "").trim();
    });
  }

  const [isContentEmpty, setIsContentEmpty] = useState(true);

  const REQUIRED_HELPER_TEXT = "this field cannot be empty";
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<"title" | "content" | "cover" | "tags", string>>
  >({});

  function clearFieldError(key: "title" | "content" | "cover" | "tags") {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function clearCoverPreview() {
    if (coverObjectUrlRef.current) {
      URL.revokeObjectURL(coverObjectUrlRef.current);
      coverObjectUrlRef.current = null;
    }
    setCoverPreviewUrl(null);
  }

  useEffect(() => {
    return () => {
      if (coverObjectUrlRef.current) {
        URL.revokeObjectURL(coverObjectUrlRef.current);
        coverObjectUrlRef.current = null;
      }
    };
  }, []);

  function resolveHeadingValue(editorInstance: Editor | null) {
    if (!editorInstance) return "paragraph";
    if (editorInstance.isActive("heading", { level: 1 })) return "h1";
    if (editorInstance.isActive("heading", { level: 2 })) return "h2";
    return "paragraph";
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),
      TiptapImage.configure({
        inline: false,
        allowBase64: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: "Enter your content",
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "min-h-[320px] w-full outline-none text-[14px] leading-relaxed text-black/80",
      },
    },
    content: initialPost?.content ?? "",
    onSelectionUpdate: ({ editor }) => {
      setHeadingValue(resolveHeadingValue(editor));
    },
    onUpdate: ({ editor }) => {
      setHeadingValue(resolveHeadingValue(editor));
      setIsContentEmpty(isEditorDocumentEmpty(editor));
      if (fieldErrors.content && editor.getText().trim()) {
        clearFieldError("content");
      }
    },
    onCreate: ({ editor }) => {
      setHeadingValue(resolveHeadingValue(editor));
      setIsContentEmpty(isEditorDocumentEmpty(editor));
    },
  });

  const isInitialState = useMemo(() => {
    if (isEditing) return false;

    const titleEmpty = !title.trim();
    const tagsEmpty = tags.length === 0;
    const coverEmpty = !coverImage && !coverPreviewUrl && !existingCoverUrl;

    return titleEmpty && tagsEmpty && coverEmpty && isContentEmpty;
  }, [
    coverImage,
    coverPreviewUrl,
    existingCoverUrl,
    isContentEmpty,
    isEditing,
    tags,
    title,
  ]);

  const createMutation = useMutation({
    mutationFn: async (params: {
      title: string;
      content: string;
      tags: string[];
      image: File;
    }) => {
      if (!token) throw new ApiError("Unauthorized", 401);
      return createPost(
        {
          title: params.title,
          content: params.content,
          tags: params.tags,
          image: params.image,
        },
        token,
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (params: {
      id: number;
      title: string;
      content: string;
      tags: string[];
      image?: File | null;
      removeImage?: boolean;
    }) => {
      if (!token) throw new ApiError("Unauthorized", 401);
      return updatePost(
        {
          id: params.id,
          title: params.title,
          content: params.content,
          tags: params.tags,
          image: params.image,
          removeImage: params.removeImage,
        },
        token,
      );
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!isFullscreen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsFullscreen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen]);

  const wrapperClassName =
    "rounded-2xl border border-black/10 bg-white overflow-hidden";

  const editorShellClassName =
    "[&_.ProseMirror]:px-4 [&_.ProseMirror]:py-4 " +
    "[&_.ProseMirror_h1]:text-[26px] [&_.ProseMirror_h1]:font-semibold [&_.ProseMirror_h1]:leading-tight [&_.ProseMirror_h1]:tracking-[-0.02em] " +
    "[&_.ProseMirror_h2]:text-[20px] [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:leading-snug [&_.ProseMirror_h2]:tracking-[-0.02em] " +
    "[&_.ProseMirror_p]:mt-3 [&_.ProseMirror_p:first-child]:mt-0 " +
    "[&_.ProseMirror_ul]:mt-3 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 " +
    "[&_.ProseMirror_ol]:mt-3 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 " +
    "[&_.ProseMirror_li]:my-1 " +
    "[&_.ProseMirror_a]:text-sky-700 [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:underline-offset-2 " +
    "[&_.ProseMirror_img]:mt-4 [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded-xl";

  const canIndent = Boolean(
    editor?.can().sinkListItem("listItem") && editor.isActive("listItem"),
  );
  const canOutdent = Boolean(
    editor?.can().liftListItem("listItem") && editor.isActive("listItem"),
  );

  function setHeading(next: HeadingValue) {
    if (!editor) return;

    const chain = editor.chain().focus();
    if (next === "paragraph") {
      chain.setParagraph().run();
      return;
    }

    const level = next === "h1" ? 1 : 2;
    chain.setHeading({ level }).run();
  }

  function toggleLink() {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL", previousUrl ?? "https://");

    if (url === null) return;
    const nextUrl = url.trim();

    if (!nextUrl) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: nextUrl })
      .run();
  }

  function removeLink() {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
  }

  function removeTagAt(index: number) {
    setSubmitError(null);
    clearFieldError("tags");
    setTags((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleTag(tag: AvailableTag) {
    setSubmitError(null);
    clearFieldError("tags");
    setTags((prev) => {
      const key = tag.toLowerCase();
      const existingIndex = prev.findIndex((t) => t.toLowerCase() === key);
      if (existingIndex >= 0)
        return prev.filter((_, idx) => idx !== existingIndex);
      if (prev.length >= 3) return prev;
      return [...prev, tag];
    });
  }

  async function onPickImageFile(file: File) {
    if (!editor) return;

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

    editor.chain().focus().setImage({ src: dataUrl }).run();
  }

  function onCoverPicked(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError("Cover image maksimal 5MB.");
      return;
    }

    setSubmitError(null);
    clearFieldError("cover");
    setRemoveExistingCover(false);
    setExistingCoverUrl(null);

    clearCoverPreview();
    const url = URL.createObjectURL(file);
    coverObjectUrlRef.current = url;
    setCoverPreviewUrl(url);

    setCoverImage(file);
  }

  function onChangeCoverImage() {
    coverInputRef.current?.click();
  }

  function onDeleteCoverImage() {
    setSubmitError(null);
    clearFieldError("cover");
    clearCoverPreview();
    setCoverImage(null);
    setExistingCoverUrl(null);
    setRemoveExistingCover(true);
  }

  async function onSubmit() {
    setSubmitError(null);
    setFieldErrors({});

    if (!token) {
      setSubmitError("Kamu harus login dulu sebelum posting.");
      return;
    }

    const cleanTitle = title.trim();
    if (!editor) {
      setSubmitError("Editor belum siap.");
      return;
    }

    const nextErrors: Partial<
      Record<"title" | "content" | "cover" | "tags", string>
    > = {};

    if (!cleanTitle) nextErrors.title = REQUIRED_HELPER_TEXT;
    if (!editor.getText().trim()) nextErrors.content = REQUIRED_HELPER_TEXT;
    if (!tags.length) nextErrors.tags = REQUIRED_HELPER_TEXT;
    if (!isEditing && !coverImage) nextErrors.cover = "file not valid";

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    try {
      if (isEditing) {
        if (!postId) {
          setSubmitError("Post id tidak valid untuk mode edit.");
          return;
        }

        const updated = await updateMutation.mutateAsync({
          id: postId,
          title: cleanTitle,
          content: editor.getHTML(),
          tags,
          image: coverImage,
          removeImage: removeExistingCover,
        });

        const targetId =
          updated && typeof (updated as { id?: unknown }).id === "number"
            ? (updated as { id: number }).id
            : postId;

        router.push(`/posts/${targetId}`);
        router.refresh();
        return;
      }

      const created = await createMutation.mutateAsync({
        title: cleanTitle,
        content: editor.getHTML(),
        tags,
        image: coverImage as File,
      });

      router.push(`/posts/${created.id}`);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError(
          isEditing ? "Gagal save. Coba lagi." : "Gagal posting. Coba lagi.",
        );
      }
    }
  }

  const coverPreviewSrc = useMemo(() => {
    if (coverPreviewUrl) return coverPreviewUrl;
    if (existingCoverUrl && !removeExistingCover)
      return resolveBackendUrl(existingCoverUrl);
    return null;
  }, [coverPreviewUrl, existingCoverUrl, removeExistingCover]);

  return (
    <main>
      <section className="py-6 sm:py-8">
        <Container>
          <h1 className="sr-only">{isEditing ? "Edit Post" : "Write Post"}</h1>

          <div className="space-y-6">
            <div>
              <label className="text-[14px] font-semibold text-black">
                Title
              </label>
              <div className="mt-2">
                <Input
                  placeholder="Enter your title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (fieldErrors.title) clearFieldError("title");
                  }}
                />
              </div>
              {fieldErrors.title ? (
                <p className="mt-1 text-xs text-rose-600">
                  {fieldErrors.title}
                </p>
              ) : null}
            </div>

            <div>
              <label className="text-[14px] font-semibold text-black">
                Content
              </label>

              <div
                className={
                  "mt-2 " +
                  (isFullscreen ? "fixed inset-0 z-60 bg-white p-4" : "")
                }
              >
                <div
                  className={wrapperClassName + (isFullscreen ? " h-full" : "")}
                >
                  <div
                    id={toolbarId}
                    className="flex flex-wrap items-center gap-1 border-b border-[#D5D7DA] bg-white px-2 py-2"
                  >
                    <div className="relative">
                      <select
                        value={headingValue}
                        onChange={(e) =>
                          setHeading(e.target.value as HeadingValue)
                        }
                        className="h-9 rounded-lg border border-black/10 bg-white px-3 text-sm font-medium text-black/70 outline-none focus:ring-2 focus:ring-black/10"
                        aria-label="Heading style"
                      >
                        <option value="paragraph">Paragraph</option>
                        {HEADING_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mx-1 h-7 w-px bg-black/10" />

                    <IconButton
                      label="Bold"
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                      disabled={
                        !editor?.can().chain().focus().toggleBold().run()
                      }
                      pressed={Boolean(editor?.isActive("bold"))}
                    >
                      <SvgIcon>
                        <path
                          d="M7 4h6a3 3 0 0 1 0 6H7V4Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M7 10h7a3 3 0 0 1 0 6H7v-6Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                      </SvgIcon>
                    </IconButton>

                    <IconButton
                      label="Strikethrough"
                      onClick={() =>
                        editor?.chain().focus().toggleStrike().run()
                      }
                      disabled={
                        !editor?.can().chain().focus().toggleStrike().run()
                      }
                      pressed={Boolean(editor?.isActive("strike"))}
                    >
                      <SvgIcon>
                        <path
                          d="M4 12h16"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M10 5h4a3 3 0 0 1 0 6h-4a3 3 0 0 0 0 6h4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                      </SvgIcon>
                    </IconButton>

                    <IconButton
                      label="Bullet list"
                      onClick={() =>
                        editor?.chain().focus().toggleBulletList().run()
                      }
                      disabled={
                        !editor?.can().chain().focus().toggleBulletList().run()
                      }
                      pressed={Boolean(editor?.isActive("bulletList"))}
                    >
                      <SvgIcon>
                        <path
                          d="M9 7h11M9 12h11M9 17h11"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M5 7h.01M5 12h.01M5 17h.01"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                      </SvgIcon>
                    </IconButton>

                    <IconButton
                      label="Numbered list"
                      onClick={() =>
                        editor?.chain().focus().toggleOrderedList().run()
                      }
                      disabled={
                        !editor?.can().chain().focus().toggleOrderedList().run()
                      }
                      pressed={Boolean(editor?.isActive("orderedList"))}
                    >
                      <SvgIcon>
                        <path
                          d="M9 7h11M9 12h11M9 17h11"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M4 7h1v3"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M4 12h2l-2 3h2"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M4 17h2"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </SvgIcon>
                    </IconButton>

                    <IconButton
                      label="Align left"
                      onClick={() =>
                        editor?.chain().focus().setTextAlign("left").run()
                      }
                      disabled={!editor}
                      pressed={Boolean(editor?.isActive({ textAlign: "left" }))}
                    >
                      <SvgIcon>
                        <path
                          d="M4 6h16M4 10h10M4 14h16M4 18h10"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </SvgIcon>
                    </IconButton>

                    <IconButton
                      label="Align center"
                      onClick={() =>
                        editor?.chain().focus().setTextAlign("center").run()
                      }
                      disabled={!editor}
                      pressed={Boolean(
                        editor?.isActive({ textAlign: "center" }),
                      )}
                    >
                      <SvgIcon>
                        <path
                          d="M4 6h16M7 10h10M4 14h16M7 18h10"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </SvgIcon>
                    </IconButton>

                    <IconButton
                      label="Align right"
                      onClick={() =>
                        editor?.chain().focus().setTextAlign("right").run()
                      }
                      disabled={!editor}
                      pressed={Boolean(
                        editor?.isActive({ textAlign: "right" }),
                      )}
                    >
                      <SvgIcon>
                        <path
                          d="M4 6h16M10 10h10M4 14h16M10 18h10"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </SvgIcon>
                    </IconButton>

                    <IconButton
                      label="Set link"
                      onClick={toggleLink}
                      disabled={!editor}
                      pressed={Boolean(editor?.isActive("link"))}
                    >
                      <SvgIcon>
                        <path
                          d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 0"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7 0"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </SvgIcon>
                    </IconButton>

                    <IconButton
                      label="Remove link"
                      onClick={removeLink}
                      disabled={!editor || !editor.isActive("link")}
                    >
                      <SvgIcon>
                        <path
                          d="M4 4l16 16"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M10 13a5 5 0 0 1 0-7l1-1"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7 0"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </SvgIcon>
                    </IconButton>

                    <IconButton
                      label="Insert image"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!editor}
                    >
                      <SvgIcon>
                        <path
                          d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          d="M8 14l2.5-2.5 3 3 2-2 4 4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M9 9h.01"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                      </SvgIcon>
                    </IconButton>

                    <input
                      ref={fileInputRef}
                      id={fileInputId}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        onPickImageFile(file).catch(() => undefined);
                        e.target.value = "";
                      }}
                    />

                    <IconButton
                      label="Indent"
                      onClick={() =>
                        editor?.chain().focus().sinkListItem("listItem").run()
                      }
                      disabled={!canIndent}
                    >
                      <SvgIcon>
                        <path
                          d="M4 6h16M10 10h10M10 14h10M4 18h16"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path d="M4 10l3 2-3 2v-4Z" fill="currentColor" />
                      </SvgIcon>
                    </IconButton>

                    <IconButton
                      label="Outdent"
                      onClick={() =>
                        editor?.chain().focus().liftListItem("listItem").run()
                      }
                      disabled={!canOutdent}
                    >
                      <SvgIcon>
                        <path
                          d="M4 6h16M10 10h10M10 14h10M4 18h16"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path d="M7 10 4 12l3 2v-4Z" fill="currentColor" />
                      </SvgIcon>
                    </IconButton>

                    <IconButton
                      label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                      onClick={() => setIsFullscreen((v) => !v)}
                      pressed={isFullscreen}
                      disabled={!editor}
                    >
                      <SvgIcon>
                        <path
                          d="M8 4H4v4M16 4h4v4M8 20H4v-4M16 20h4v-4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </SvgIcon>
                    </IconButton>
                  </div>

                  <div
                    className={
                      editorShellClassName +
                      (isFullscreen ? " h-[calc(100%-56px)] overflow-auto" : "")
                    }
                  >
                    {editor ? (
                      <EditorContent editor={editor} />
                    ) : (
                      <div className="px-4 py-4 text-sm text-black/40">
                        Loading editor...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {fieldErrors.content ? (
                <p className="mt-1 text-xs text-rose-600">
                  {fieldErrors.content}
                </p>
              ) : null}

              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-[14px] font-semibold text-black">
                    Cover Image
                  </label>

                  <input
                    id={coverInputId}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    ref={coverInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      if (!file) return;
                      onCoverPicked(file);
                      e.target.value = "";
                    }}
                  />

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsCoverDragging(true);
                    }}
                    onDragLeave={() => setIsCoverDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsCoverDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (!file) return;
                      onCoverPicked(file);
                    }}
                    className={
                      "mt-2 rounded-2xl border border-dashed p-4 transition " +
                      (isCoverDragging
                        ? "border-sky-500 bg-sky-50"
                        : "border-black/25 bg-white")
                    }
                  >
                    {coverPreviewSrc ? (
                      <div className="space-y-3">
                        <div className="relative h-[180px] w-full overflow-hidden rounded-xl bg-black/5">
                          <Image
                            src={coverPreviewSrc}
                            alt="Cover preview"
                            fill
                            sizes="(max-width: 768px) 100vw, 640px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>

                        <div className="flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={onChangeCoverImage}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 text-sm font-semibold text-black/75 hover:bg-black/5"
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
                                d="M12 16V6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <path
                                d="M8.5 9.5 12 6l3.5 3.5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M5 18h14"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                            Change Image
                          </button>

                          <button
                            type="button"
                            onClick={onDeleteCoverImage}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 text-sm font-semibold text-rose-500 hover:bg-rose-50"
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
                                d="M6 7h12"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <path
                                d="M10 7V5h4v2"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <path
                                d="M8 7l1 14h6l1-14"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Delete Image
                          </button>
                        </div>

                        <p className="text-center text-xs text-black/45">
                          PNG or JPG (max. 5mb)
                        </p>
                      </div>
                    ) : (
                      <label
                        htmlFor={coverInputId}
                        className="block cursor-pointer px-2 py-6 text-center"
                      >
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-white text-black/70">
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                          >
                            <path
                              d="M12 16V8"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <path
                              d="M8.5 11.5 12 8l3.5 3.5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M20 16.5a4.5 4.5 0 0 0-3.9-4.45A5.5 5.5 0 0 0 5.6 10.2 3.8 3.8 0 0 0 6 17.7"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>

                        <p className="mt-3 text-sm text-black/60">
                          <span className="font-medium text-sky-700">
                            Click to upload
                          </span>{" "}
                          <span>or drag and drop</span>
                        </p>
                        <p className="mt-1 text-xs text-black/45">
                          PNG or JPG (max. 5mb)
                        </p>
                      </label>
                    )}
                  </div>

                  {fieldErrors.cover ? (
                    <p className="mt-1 text-xs text-rose-600">
                      {fieldErrors.cover}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="text-[14px] font-semibold text-black">
                    Tags
                  </label>
                  <div className="mt-2">
                    <div className="min-h-11 w-full rounded-xl border border-black/10 bg-white px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {tags.length === 0 ? (
                          <span className="text-[12px] text-black/40">
                            Select tags
                          </span>
                        ) : null}

                        {tags.map((tag, index) => (
                          <span
                            key={`${tag}-${index}`}
                            className="inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1 text-[12px] font-semibold text-black/70"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTagAt(index)}
                              className="grid h-4 w-4 place-items-center rounded-full bg-black/10 text-[12px] leading-none text-black/60 hover:bg-black/15"
                              aria-label={`Remove tag ${tag}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {AVAILABLE_TAGS.map((tag) => {
                        const selected = tags.some(
                          (t) => t.toLowerCase() === tag.toLowerCase(),
                        );
                        const disabled = !selected && tags.length >= 3;

                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            disabled={disabled}
                            className={
                              "h-9 rounded-full px-4 text-[12px] font-semibold transition " +
                              (selected
                                ? "bg-sky-600 text-white hover:bg-sky-700"
                                : "border border-black/10 bg-white text-black/70 hover:bg-black/5") +
                              (disabled ? " cursor-not-allowed opacity-40" : "")
                            }
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {fieldErrors.tags ? (
                    <p className="mt-1 text-xs text-rose-600">
                      {fieldErrors.tags}
                    </p>
                  ) : null}
                </div>

                {submitError ? (
                  <div className="text-sm text-red-600">{submitError}</div>
                ) : null}

                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={isSubmitting}
                  className="inline-flex h-12 w-full items-center justify-center rounded-full bg-sky-600 text-sm font-semibold text-white transition hover:bg-sky-600/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting
                    ? isEditing
                      ? "Saving..."
                      : "Posting..."
                    : isEditing
                      ? "Save"
                      : isInitialState
                        ? "Finish"
                        : "Save"}
                </button>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
