import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { createMockRoom, resetLobbyStoreForTests } from "@/utils/lobby.ts";
import { handler as joinHandler } from "@/routes/api/lobby/rooms/[roomId]/join.ts";
import { handler as readyHandler } from "@/routes/api/lobby/rooms/[roomId]/ready.ts";
import { handler as startHandler } from "@/routes/api/lobby/rooms/[roomId]/start.ts";

Deno.test("POST /join agrega jugador real por nombre", async () => {
  resetLobbyStoreForTests();
  const created = createMockRoom({ hostName: "Host" });

  const req = new Request(
    `http://localhost/api/lobby/rooms/${created.room.id}/join`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Ana" }),
    },
  );

  const res = await joinHandler.POST?.(
    { params: { roomId: created.room.id }, req } as never,
  );
  assertEquals(res?.status, 200);

  const data = await res?.json();
  assertEquals(data.room.players.length, 2);
  assertEquals(typeof data.playerId, "string");
});

Deno.test("POST /join valida límite máximo de jugadores", async () => {
  resetLobbyStoreForTests();
  const created = createMockRoom({ hostName: "Host" });
  created.room.maxPlayers = 1;

  const req = new Request(
    `http://localhost/api/lobby/rooms/${created.room.id}/join`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Ana" }),
    },
  );

  const res = await joinHandler.POST?.(
    { params: { roomId: created.room.id }, req } as never,
  );
  assertEquals(res?.status, 409);

  const data = await res?.json();
  assertEquals(data.error, "ROOM_PLAYER_LIMIT_REACHED");
});

Deno.test("POST /start responde error si hay jugadores no listos", async () => {
  resetLobbyStoreForTests();
  const created = createMockRoom({ hostName: "Host" });

  const joinReq = new Request(
    `http://localhost/api/lobby/rooms/${created.room.id}/join`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Ana" }),
    },
  );

  await joinHandler.POST?.(
    { params: { roomId: created.room.id }, req: joinReq } as never,
  );

  const startReq = new Request(
    `http://localhost/api/lobby/rooms/${created.room.id}/start`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ playerId: created.playerId, playerCount: 2 }),
    },
  );

  const res = await startHandler.POST?.({
    params: { roomId: created.room.id },
    req: startReq,
  } as never);
  assertEquals(res?.status, 409);

  const data = await res?.json();
  assertEquals(data.error, "PLAYERS_NOT_READY");
});

Deno.test("POST /ready + /start inicia partida cuando todos están listos", async () => {
  resetLobbyStoreForTests();
  const created = createMockRoom({ hostName: "Host" });

  const joinReq = new Request(
    `http://localhost/api/lobby/rooms/${created.room.id}/join`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Ana" }),
    },
  );

  const joinRes = await joinHandler.POST?.({
    params: { roomId: created.room.id },
    req: joinReq,
  } as never);
  const joinData = await joinRes?.json();

  const readyReq = new Request(
    `http://localhost/api/lobby/rooms/${created.room.id}/ready`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ playerId: joinData.playerId, ready: true }),
    },
  );

  const readyRes = await readyHandler.POST?.({
    params: { roomId: created.room.id },
    req: readyReq,
  } as never);
  assertEquals(readyRes?.status, 200);

  const startReq = new Request(
    `http://localhost/api/lobby/rooms/${created.room.id}/start`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ playerId: created.playerId, playerCount: 2 }),
    },
  );

  const startRes = await startHandler.POST?.({
    params: { roomId: created.room.id },
    req: startReq,
  } as never);
  assertEquals(startRes?.status, 200);

  const startData = await startRes?.json();
  assertEquals(startData.room.status, "in_progress");
  assertEquals(startData.room.players.length, 2);
});
