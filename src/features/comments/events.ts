export const COMMENTS_COUNT_CHANGED_EVENT = "comments:count-changed" as const;

export type CommentsCountChangedDetail = {
  postId: number;
  count: number;
};

export function emitCommentsCountChanged(detail: CommentsCountChangedDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<CommentsCountChangedDetail>(COMMENTS_COUNT_CHANGED_EVENT, {
      detail,
    }),
  );
}
