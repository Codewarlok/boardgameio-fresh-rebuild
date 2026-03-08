import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { createMockRoom, resetLobbyStoreForTests } from "@/utils/lobby.ts";
import { handler as wsHandler } from "@/routes/api/lobby/rooms/[roomId]/ws.ts";

Deno.test("GET /ws responde 404 si la sala no existe", async () => {
  resetLobbyStoreForTests();

  const req = new Request("http://localhost/api/lobby/rooms/UNKNOWN/ws", {
    method: "GET",
  });

  const res = await wsHandler.GET?.({
    params: { roomId: "UNKNOWN" },
    req,
  } as never);

  assertEquals(res?.status, 404);
});

Deno.test("GET /ws responde 400 si no es upgrade websocket", async () => {
  resetLobbyStoreForTests();
  const created = createMockRoom({ hostName: "Host" });

  const req = new Request(
    `http://localhost/api/lobby/rooms/${created.room.id}/ws`,
    { method: "GET" },
  );

  const res = await wsHandler.GET?.({
    params: { roomId: created.room.id },
    req,
  } as never);

  assertEquals(res?.status, 400);
});
