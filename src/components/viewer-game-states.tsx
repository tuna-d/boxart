"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { loadMyGameStates } from "@/app/games/actions";
import type { ViewerGameState } from "@/lib/library";
import type { PlatformId } from "@/lib/platforms";

type ViewerGameStates = {
  signedIn: boolean;
  playerPlatforms: readonly PlatformId[];
  /** Keyed by game id. A game is missing while its state is still loading. */
  states: Record<string, ViewerGameState>;
  setState: (gameId: string, state: ViewerGameState) => void;
  reload: (gameId: string) => void;
};

const noState: ViewerGameState = { entry: null, diaryCount: 0 };
const noPlatforms: PlatformId[] = [];
const ViewerGameStatesContext = createContext<ViewerGameStates | null>(null);

type ProviderProps = {
  gameIds: string[];
  signedIn: boolean;
  playerPlatforms?: readonly PlatformId[];
  children: ReactNode;
};

/** Loads the signed-in player's shelf entry for every game in a grid, so covers can offer quick logging. */
export function ViewerGameStatesProvider({ gameIds, signedIn, playerPlatforms = noPlatforms, children }: ProviderProps) {
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

  const idsKey = gameIds.join();
  useEffect(() => {
    if (!signedIn) return;
    const missing = idsKey.split(",").filter((id) => id && !requested.current.has(id));
    if (missing.length === 0) return;
    for (const id of missing) requested.current.add(id);
    load(missing).catch(() => {
      for (const id of missing) requested.current.delete(id);
    });
  }, [idsKey, signedIn, load]);

  const setState = useCallback((gameId: string, state: ViewerGameState) => {
    setStates((current) => ({ ...current, [gameId]: state }));
  }, []);

  const reload = useCallback((gameId: string) => void load([gameId]).catch(() => {}), [load]);

  const value = useMemo(
    () => ({ signedIn, playerPlatforms, states, setState, reload }),
    [signedIn, playerPlatforms, states, setState, reload],
  );

  return <ViewerGameStatesContext.Provider value={value}>{children}</ViewerGameStatesContext.Provider>;
}

export function useViewerGameStates() {
  return useContext(ViewerGameStatesContext);
}
