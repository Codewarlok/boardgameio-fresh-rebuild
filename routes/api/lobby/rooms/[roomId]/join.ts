import { define } from "@/utils.ts";
import {
  joinRoom,
  type JoinRoomRequest,
  type JoinRoomResponse,
  LobbyDomainError,
} from "@/utils/lobby.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const roomId = ctx.params.roomId.toUpperCase();
    const body = await parseBody(ctx.req);

    try {
      const response: JoinRoomResponse = joinRoom(roomId, body);
      return Response.json(response, { status: 200 });
    } catch (error) {
      return toErrorResponse(error);
    }
  },
});

async function parseBody(req: Request): Promise<JoinRoomRequest> {
  const contentType = req.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return {};
  }

  try {
    const parsed = await req.json();

    if (isJoinRoomRequest(parsed)) {
      return parsed;
    }
  } catch {
    // fallback
  }

  return {};
}

function isJoinRoomRequest(value: unknown): value is JoinRoomRequest {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const candidate = value as { name?: unknown };
  return candidate.name === undefined || typeof candidate.name === "string";
}

function toErrorResponse(error: unknown): Response {
  if (!(error instanceof LobbyDomainError)) {
    return Response.json({
      error: "INTERNAL_ERROR",
      message: "Unexpected error",
    }, {
      status: 500,
    });
  }

  const status = error.code === "ROOM_NOT_FOUND"
    ? 404
    : error.code === "ROOM_NOT_WAITING" ||
        error.code === "PLAYER_NAME_TAKEN" ||
        error.code === "ROOM_PLAYER_LIMIT_REACHED"
    ? 409
    : 400;

  return Response.json({ error: error.code, message: error.message }, {
    status,
  });
}
