import { define } from "@/utils.ts";
import { getRoomById, type GetRoomStateResponse } from "@/utils/lobby.ts";

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

    const response: GetRoomStateResponse = { room };
    return Response.json(response);
  },
});
