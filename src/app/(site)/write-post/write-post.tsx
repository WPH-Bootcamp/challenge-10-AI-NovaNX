"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";

import { Container } from "@/components/layout/Container";
import { Input } from "@/components/ui/Input";
import { useAuthToken } from "@/features/auth/useAuthToken";
import { createPost } from "@/features/posts/api";
import { ApiError } from "@/lib/api";

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

export default function WritePost() {
  const toolbarId = useId();
  const fileInputId = useId();
  const coverInputId = useId();
  const router = useRouter();
  const token = useAuthToken();

  const [title, setTitle] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [headingValue, setHeadingValue] = useState<HeadingValue>("paragraph");

  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [isCoverDragging, setIsCoverDragging] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function resolveHeadingValue(editorInstance: Editor | null) {
    if (!editorInstance) return "paragraph";
    if (editorInstance.isActive("heading", { level: 1 })) return "h1";
    if (editorInstance.isActive("heading", { level: 2 })) return "h2";
    return "paragraph";
  }

  const editor = useEditor({
    // Prevent SSR/hydration mismatches in Next.js
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
    content: "",
    onSelectionUpdate: ({ editor }) => {
      setHeadingValue(resolveHeadingValue(editor));
    },
    onUpdate: ({ editor }) => {
      setHeadingValue(resolveHeadingValue(editor));
    },
    onCreate: ({ editor }) => {
      setHeadingValue(resolveHeadingValue(editor));
    },
  });

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

  function normalizeTag(input: string) {
    const trimmed = input.trim();
    if (!trimmed) return "";
    return trimmed.startsWith("#") ? trimmed.slice(1).trim() : trimmed;
  }

  function addTagsFromRaw(raw: string) {
    const pieces = raw
      .split(",")
      .map((p) => normalizeTag(p))
      .filter(Boolean);

    if (!pieces.length) return;

    setTags((prev) => {
      const existing = new Set(prev.map((t) => t.toLowerCase()));
      const next = [...prev];
      for (const piece of pieces) {
        const key = piece.toLowerCase();
        if (existing.has(key)) continue;
        existing.add(key);
        next.push(piece);
      }
      return next;
    });
  }

  async function onFinish() {
    setSubmitError(null);
    if (!token) {
      setSubmitError("Kamu harus login dulu sebelum posting.");
      return;
    }

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setSubmitError("Title wajib diisi.");
      return;
    }

    if (!editor) {
      setSubmitError("Editor belum siap.");
      return;
    }

    const text = editor.getText().trim();
    if (!text) {
      setSubmitError("Content wajib diisi.");
      return;
    }

    if (!tags.length) {
      setSubmitError("Minimal 1 tag.");
      return;
    }

    if (!coverImage) {
      setSubmitError("Cover image wajib diupload.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createPost(
        {
          title: cleanTitle,
          content: editor.getHTML(),
          tags,
          image: coverImage,
        },
        token,
      );

      router.push(`/posts/${created.id}`);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Gagal posting. Coba lagi.");
      }
    } finally {
      setIsSubmitting(false);
    }
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
    setCoverImage(file);
  }

  return (
    <main>
      <section className="py-6 sm:py-8">
        <Container>
          <h1 className="sr-only">Write Post</h1>

          <div className="space-y-6">
            <div>
              <label className="text-[14px] font-semibold text-black">
                Title
              </label>
              <div className="mt-2">
                <Input
                  placeholder="Enter your title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
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
                          d="M6 7c0-1.7 1.8-3 4-3h4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M6 12h12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M10 20H6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M18 17c0 1.7-1.8 3-4 3h-2"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </SvgIcon>
                    </IconButton>

                    <IconButton
                      label="Italic"
                      onClick={() =>
                        editor?.chain().focus().toggleItalic().run()
                      }
                      disabled={
                        !editor?.can().chain().focus().toggleItalic().run()
                      }
                      pressed={Boolean(editor?.isActive("italic"))}
                    >
                      <SvgIcon>
                        <path
                          d="M10 4h8"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M6 20h8"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M14 4 10 20"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </SvgIcon>
                    </IconButton>

                    <IconButton
                      label="Bullet list"
                      onClick={() =>
                        editor?.chain().focus().toggleBulletList().run()
                      }
                      pressed={Boolean(editor?.isActive("bulletList"))}
                    >
                      <SvgIcon>
                        <path
                          d="M8 6h13M8 12h13M8 18h13"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M4 6h.01M4 12h.01M4 18h.01"
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
                      pressed={Boolean(editor?.isActive("orderedList"))}
                    >
                      <SvgIcon>
                        <path
                          d="M9 6h11M9 12h11M9 18h11"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M4 7V5l-1 1"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M3 12h2l-2 2h2"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M3 19h2"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M4 18v2"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </SvgIcon>
                    </IconButton>

                    <div className="mx-1 h-7 w-px bg-black/10" />

                    <IconButton
                      label="Align left"
                      onClick={() =>
                        editor?.chain().focus().setTextAlign("left").run()
                      }
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
                      label="Justify"
                      onClick={() =>
                        editor?.chain().focus().setTextAlign("justify").run()
                      }
                      pressed={Boolean(
                        editor?.isActive({ textAlign: "justify" }),
                      )}
                    >
                      <SvgIcon>
                        <path
                          d="M4 6h16M4 10h16M4 14h16M4 18h16"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </SvgIcon>
                    </IconButton>

                    <div className="mx-1 h-7 w-px bg-black/10" />

                    <IconButton
                      label="Insert/edit link"
                      onClick={toggleLink}
                      pressed={Boolean(editor?.isActive("link"))}
                      disabled={!editor}
                    >
                      <SvgIcon>
                        <path
                          d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </SvgIcon>
                    </IconButton>

                    <IconButton
                      label="Remove link"
                      onClick={removeLink}
                      disabled={!editor?.isActive("link")}
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
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      if (!file) return;
                      onCoverPicked(file);
                      e.target.value = "";
                    }}
                  />

                  <label
                    htmlFor={coverInputId}
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
                      "mt-2 block cursor-pointer rounded-2xl border border-dashed px-4 py-7 text-center transition " +
                      (isCoverDragging
                        ? "border-sky-500 bg-sky-50"
                        : "border-black/25 bg-white hover:border-black/35")
                    }
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

                    {coverImage ? (
                      <p className="mt-2 text-xs font-medium text-black/60">
                        {coverImage.name}
                      </p>
                    ) : null}
                  </label>
                </div>

                <div>
                  <label className="text-[14px] font-semibold text-black">
                    Tags
                  </label>
                  <div className="mt-2">
                    <Input
                      placeholder="Enter your tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          addTagsFromRaw(tagInput);
                          setTagInput("");
                        }
                      }}
                    />
                  </div>
                </div>

                {submitError ? (
                  <div className="text-sm text-red-600">{submitError}</div>
                ) : null}

                <button
                  type="button"
                  onClick={onFinish}
                  disabled={isSubmitting}
                  className="inline-flex h-12 w-full items-center justify-center rounded-full bg-sky-600 text-sm font-semibold text-white transition hover:bg-sky-600/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Posting..." : "Finish"}
                </button>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
