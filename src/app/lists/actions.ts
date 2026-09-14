"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentPlayer, type CurrentPlayer } from "@/lib/auth";
import { getGameBySlug } from "@/lib/games";
import { LIST_ITEM_LIMIT, parseListId } from "@/lib/lists";
import { createClient } from "@/lib/supabase/server";

const TITLE_LIMIT = 80;
const DESCRIPTION_LIMIT = 1000;

export type ListFormState = {
  error?: string;
  values?: { title: string; description: string; ranked: boolean };
} | null;

export type AddGameState = {
  error?: string;
  added?: string;
} | null;

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function refreshList(listId: number, player: CurrentPlayer) {
  revalidatePath(`/lists/${listId}`);
  revalidatePath("/lists");
  if (player.username) revalidatePath(`/players/${player.username}`);
}

function readListDetails(formData: FormData) {
  const values = {
    title: readText(formData, "title"),
    description: readText(formData, "description"),
    ranked: formData.get("ranked") === "on",
  };
  if (!values.title) return { values, error: "Give your list a title." };
  if (values.title.length > TITLE_LIMIT) {
    return { values, error: `Titles can be up to ${TITLE_LIMIT} characters.` };
  }
  if (values.description.length > DESCRIPTION_LIMIT) {
    return { values, error: `Descriptions can be up to ${DESCRIPTION_LIMIT} characters.` };
  }
  return { values };
}

export async function createList(_previous: ListFormState, formData: FormData): Promise<ListFormState> {
  const player = await getCurrentPlayer();
  if (!player) return { error: "Sign in to make a list." };

  const { values, error } = readListDetails(formData);
  if (error) return { error, values };

  const supabase = await createClient();
  const { data, error: insertError } = await supabase
    .from("lists")
    .insert({ title: values.title, description: values.description || null, ranked: values.ranked })
    .select("id")
    .single();
  if (insertError || !data) {
    return { error: "Could not make the list. Try again in a moment.", values };
  }

  refreshList(data.id, player);
  redirect(`/lists/${data.id}`);
}

export async function updateList(_previous: ListFormState, formData: FormData): Promise<ListFormState> {
  const player = await getCurrentPlayer();
  if (!player) return { error: "Sign in to edit your list." };

  const listId = parseListId(formData.get("listId"));
  if (!listId) return { error: "That list could not be found." };

  const { values, error } = readListDetails(formData);
  if (error) return { error, values };

  const supabase = await createClient();
  const { data, error: updateError } = await supabase
    .from("lists")
    .update({
      title: values.title,
      description: values.description || null,
      ranked: values.ranked,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listId)
    .eq("user_id", player.id)
    .select("id");
  if (updateError || !data?.length) {
    return { error: "Could not save the list. Try again in a moment.", values };
  }

  refreshList(listId, player);
  redirect(`/lists/${listId}`);
}

export async function deleteList(formData: FormData) {
  const player = await getCurrentPlayer();
  if (!player) redirect("/sign-in");

  const listId = parseListId(formData.get("listId"));
  if (!listId) return;

  const supabase = await createClient();
  await supabase.from("lists").delete().eq("id", listId).eq("user_id", player.id);

  refreshList(listId, player);
  redirect(player.username ? `/players/${player.username}` : "/lists");
}

export async function addGameToList(_previous: AddGameState, formData: FormData): Promise<AddGameState> {
  const player = await getCurrentPlayer();
  if (!player) return { error: "Sign in to add games to a list." };

  const listId = parseListId(formData.get("listId"));
  if (!listId) return { error: "Pick a list first." };

  const game = await getGameBySlug(readText(formData, "slug"));
  if (!game) return { error: "That game could not be found." };

  const supabase = await createClient();
  const { data: list } = await supabase
    .from("lists")
    .select("title, items_count")
    .eq("id", listId)
    .eq("user_id", player.id)
    .maybeSingle();
  if (!list) return { error: "That list could not be found." };
  if (list.items_count >= LIST_ITEM_LIMIT) {
    return { error: `A list can hold up to ${LIST_ITEM_LIMIT} games.` };
  }

  const { error } = await supabase.from("list_items").insert({
    list_id: listId,
    game_id: Number(game.id),
    game_slug: game.slug,
    game_title: game.title,
    game_cover_url: game.coverUrl,
    game_release_date: game.releaseDate,
  });
  // A game that is already on the list hits the unique constraint, which is fine.
  if (error && error.code !== "23505") {
    return { error: "Could not add the game. Try again in a moment." };
  }

  refreshList(listId, player);
  revalidatePath(`/games/${game.slug}`);
  return { added: list.title };
}

export async function removeListEntry(formData: FormData) {
  const player = await getCurrentPlayer();
  if (!player) redirect("/sign-in");

  const listId = parseListId(formData.get("listId"));
  const entryId = parseListId(formData.get("entryId"));
  if (!listId || !entryId) return;

  // Row level security keeps players to their own lists.
  const supabase = await createClient();
  await supabase.from("list_items").delete().eq("id", entryId).eq("list_id", listId);
  refreshList(listId, player);
}

export async function moveListEntry(formData: FormData) {
  const player = await getCurrentPlayer();
  if (!player) redirect("/sign-in");

  const listId = parseListId(formData.get("listId"));
  const entryId = parseListId(formData.get("entryId"));
  const direction = formData.get("direction") === "up" ? -1 : 1;
  if (!listId || !entryId) return;

  const supabase = await createClient();
  await supabase.rpc("move_list_item", { target_item_id: entryId, direction });
  refreshList(listId, player);
}

export async function toggleListLike(formData: FormData) {
  const player = await getCurrentPlayer();
  if (!player) redirect("/sign-in");

  const listId = parseListId(formData.get("id"));
  const liked = formData.get("liked") === "true";
  const path = formData.get("path");
  if (!listId) return;

  const supabase = await createClient();
  if (liked) {
    await supabase.from("list_likes").delete().eq("list_id", listId).eq("user_id", player.id);
  } else {
    // A repeated like hits the primary key and is ignored.
    await supabase.from("list_likes").insert({ list_id: listId });
  }

  revalidatePath("/lists");
  if (typeof path === "string" && path.startsWith("/")) revalidatePath(path);
}
