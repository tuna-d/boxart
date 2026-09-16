"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadMyGameStates } from "@/app/games/actions";
import { QuickLogCard } from "@/components/quick-log-card";
import type { ViewerGameState } from "@/lib/library";
import type { PlatformId } from "@/lib/platforms";
import type { GameListItem } from "@/lib/types";

const noState: ViewerGameState = { entry: null, diaryCount: 0 };
const noPlatforms: PlatformId[] = [];

type GameListProps = {
  items: GameListItem[];
  signedIn: boolean;
  playerPlatforms?: PlatformId[];
};

/** A cover grid where signed-in players can shelve games without opening them. */
export function GameList({ items, signedIn, playerPlatforms = noPlatforms }: GameListProps) {
  const [states, setStates] = useState<Record<string, ViewerGameState>>({});
  // Ids already asked for, so each new page of games only loads its own entries.
  const requested = useRef(new Set<string>());

  const load = useCallback(async (ids: string[]) => {
    const result = await loadMyGameStates(ids);
    if (!result) return;
    setStates((current) => {
      const next = { ...current };
      for (const id of ids) next[id] = result[id] ?? noState;
      return next;
    });
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    const missing = items.map((item) => item.game.id).filter((id) => !requested.current.has(id));
    if (missing.length === 0) return;
    for (const id of missing) requested.current.add(id);
    load(missing).catch(() => {
      for (const id of missing) requested.current.delete(id);
    });
  }, [items, signedIn, load]);

  const onStateChange = useCallback((gameId: string, state: ViewerGameState) => {
    setStates((current) => ({ ...current, [gameId]: state }));
  }, []);

  // The log dialog can change the rating, review or diary, so read the entry again when it closes.
  const onDialogClose = useCallback((gameId: string) => void load([gameId]).catch(() => {}), [load]);

  return (
    <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
      {items.map((item) => (
        <li key={item.game.id}>
          <QuickLogCard
            {...item}
            signedIn={signedIn}
            playerPlatforms={playerPlatforms}
            state={states[item.game.id]}
            onStateChange={onStateChange}
            onDialogClose={onDialogClose}
          />
        </li>
      ))}
    </ul>
  );
}
