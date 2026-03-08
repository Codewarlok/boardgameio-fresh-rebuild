import { assertEquals } from "jsr:@std/assert@^1.0.0";
import {
  createMockRoom,
  joinRoom,
  type LobbyRoomEventType,
  resetLobbyStoreForTests,
  setPlayerReady,
  startPrincesaGame,
  subscribeRoomEvents,
} from "@/utils/lobby.ts";

Deno.test("subscribeRoomEvents emite eventos de sala en orden", () => {
  resetLobbyStoreForTests();

  const created = createMockRoom({ hostName: "Host" });
  const seen: LobbyRoomEventType[] = [];

  const unsubscribe = subscribeRoomEvents(created.room.id, (event) => {
    seen.push(event.type);
  });

  const joined = joinRoom(created.room.id, { name: "Ana" });
  setPlayerReady(created.room.id, joined.playerId, true);
  startPrincesaGame(created.room.id, { playerId: created.playerId });

  unsubscribe();

  assertEquals(seen, ["player_joined", "player_ready_changed", "game_started"]);
});
