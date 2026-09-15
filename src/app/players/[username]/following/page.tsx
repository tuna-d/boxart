import type { Metadata } from "next";
import { FollowListPage } from "@/components/follow-list-page";

export async function generateMetadata(props: PageProps<"/players/[username]/following">): Promise<Metadata> {
  const { username } = await props.params;
  return { title: `Following · ${username}` };
}

export default async function FollowingPage(props: PageProps<"/players/[username]/following">) {
  const { username } = await props.params;
  return <FollowListPage username={username} direction="following" />;
}
