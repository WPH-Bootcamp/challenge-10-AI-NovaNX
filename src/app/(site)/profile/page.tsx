import type { Metadata } from "next";

import ProfileClient from "./profile-client";

export const metadata: Metadata = {
  title: "Profile",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ProfilePage() {
  return <ProfileClient />;
}
