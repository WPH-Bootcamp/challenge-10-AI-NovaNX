import type { Metadata } from "next";

import WritePost from "./write-post";

export const metadata: Metadata = {
  title: "Write Post",
};

export default function WritePostPage() {
  return <WritePost />;
}
