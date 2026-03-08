import { define } from "@/utils.ts";
import {
  getRoomById,
  type LobbyRoomEvent,
  subscribeRoomEvents,
} from "@/utils/lobby.ts";

export const handler = define.handlers({
  GET(ctx) {
    const roomId = ctx.params.roomId.toUpperCase();
    const room = getRoomById(roomId);

    if (!room) {
      return Response.json({
        error: "ROOM_NOT_FOUND",
        message: `Room ${roomId} not found`,
      }, { status: 404 });
    }

    if (ctx.req.headers.get("upgrade")?.toLowerCase() !== "websocket") {
      return Response.json({
        error: "BAD_REQUEST",
        message: "Expected WebSocket upgrade request",
      }, { status: 400 });
    }

    const { socket, response } = Deno.upgradeWebSocket(ctx.req);

    let unsubscribe: (() => void) | null = null;

    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: "ROOM_SNAPSHOT",
        room,
        emittedAt: new Date().toISOString(),
      }));

      unsubscribe = subscribeRoomEvents(roomId, (event: LobbyRoomEvent) => {
        if (socket.readyState !== WebSocket.OPEN) return;
        socket.send(JSON.stringify(event));
      });
    };

    socket.onclose = () => {
      unsubscribe?.();
      unsubscribe = null;
    };

    socket.onerror = () => {
      unsubscribe?.();
      unsubscribe = null;
    };

    return response;
  },
});
