import { HttpError } from "fresh";
import { define } from "@/utils.ts";
import { getRoomById, type GetRoomStateResponse } from "@/utils/lobby.ts";

export const handler = define.handlers({
  GET(ctx) {
    const roomId = ctx.params.roomId.toUpperCase();
    const room = getRoomById(roomId);

    if (!room) {
      throw new HttpError(404, `Room ${roomId} not found`);
    }

    const response: GetRoomStateResponse = { room };
    return Response.json(response);
  },
});
