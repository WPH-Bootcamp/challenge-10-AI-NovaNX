"use client";

import { useEffect } from "react";

export function DeletePostModal({
  isOpen,
  onClose,
  onConfirm,
  isPending,
  error,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending?: boolean;
  error?: string;
}) {
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Delete"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <h2 className="text-[14px] font-semibold text-black/90">Delete</h2>
          <button
            type="button"
            aria-label="Close"
            className="rounded-lg p-2 text-black/50 hover:bg-black/5 hover:text-black/70"
            onClick={onClose}
            disabled={Boolean(isPending)}
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

        <p className="mt-2 text-[12px] text-black/45">
          Are you sure to delete?
        </p>

        {error ? (
          <p className="mt-3 text-[12px] text-rose-600">{error}</p>
        ) : null}

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            className="h-10 rounded-full px-6 text-[12px] font-semibold text-black/70 hover:bg-black/5"
            onClick={onClose}
            disabled={Boolean(isPending)}
          >
            Cancel
          </button>
          <button
            type="button"
            className={
              "h-10 rounded-full bg-rose-500 px-8 text-[12px] font-semibold text-white transition hover:bg-rose-600 " +
              (isPending ? "cursor-not-allowed opacity-70" : "")
            }
            onClick={onConfirm}
            disabled={Boolean(isPending)}
          >
            {isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
