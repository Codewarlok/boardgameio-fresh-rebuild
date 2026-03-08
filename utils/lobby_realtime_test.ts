import { assertEquals } from "jsr:@std/assert@^1.0.0";
import {
  createMockRoom,
  joinRoom,
  resetLobbyStoreForTests,
  subscribeRoomEvents,
} from "@/utils/lobby.ts";

Deno.test("subscribeRoomEvents emite ROOM_UPDATED en join", () => {
  resetLobbyStoreForTests();
  const created = createMockRoom({ hostName: "Host" });

  const events: string[] = [];
  const unsubscribe = subscribeRoomEvents(created.room.id, (event) => {
    events.push(event.type);
  });

  joinRoom(created.room.id, { name: "Ana" });
  unsubscribe();

  assertEquals(events, ["ROOM_UPDATED"]);
});
