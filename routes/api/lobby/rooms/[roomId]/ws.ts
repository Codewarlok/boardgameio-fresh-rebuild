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
      return Response.json(
        { error: "ROOM_NOT_FOUND", message: `Room ${roomId} not found` },
        { status: 404 },
      );
    }

    const upgrade = ctx.req.headers.get("upgrade");
    if (upgrade?.toLowerCase() !== "websocket") {
      return Response.json(
        { error: "UPGRADE_REQUIRED", message: "Use WebSocket upgrade" },
        { status: 426 },
      );
    }

    const { socket, response } = Deno.upgradeWebSocket(ctx.req);
    let unsubscribe: (() => void) | null = null;

    const sendEvent = (event: LobbyRoomEvent) => {
      if (socket.readyState !== WebSocket.OPEN) return;
      socket.send(JSON.stringify(event));
    };

    socket.onopen = () => {
      sendEvent({ type: "room_snapshot", room, ts: new Date().toISOString() });
      unsubscribe = subscribeRoomEvents(roomId, sendEvent);
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
