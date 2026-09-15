import type { Metadata } from "next";
import { FollowListPage } from "@/components/follow-list-page";

export async function generateMetadata(props: PageProps<"/players/[username]/followers">): Promise<Metadata> {
  const { username } = await props.params;
  return { title: `Followers · ${username}` };
}

export default async function FollowersPage(props: PageProps<"/players/[username]/followers">) {
  const { username } = await props.params;
  return <FollowListPage username={username} direction="followers" />;
}
