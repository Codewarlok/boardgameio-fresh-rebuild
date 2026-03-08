import { define } from "@/utils.ts";
import {
  LobbyDomainError,
  setPlayerReady,
  type SetReadyRequest,
  type SetReadyResponse,
} from "@/utils/lobby.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const roomId = ctx.params.roomId.toUpperCase();
    const body = await parseBody(ctx.req);

    if (!body.playerId) {
      return Response.json({
        error: "PLAYER_NOT_FOUND",
        message: "playerId is required",
      }, {
        status: 400,
      });
    }

    try {
      const room = setPlayerReady(roomId, body.playerId, body.ready ?? true);
      const response: SetReadyResponse = { room };
      return Response.json(response, { status: 200 });
    } catch (error) {
      return toErrorResponse(error);
    }
  },
});

async function parseBody(req: Request): Promise<SetReadyRequest> {
  const contentType = req.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return {};
  }

  try {
    const parsed = await req.json();

    if (isSetReadyRequest(parsed)) {
      return parsed;
    }
  } catch {
    // fallback
  }

  return {};
}

function isSetReadyRequest(value: unknown): value is SetReadyRequest {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const candidate = value as { playerId?: unknown; ready?: unknown };
  const validPlayerId = candidate.playerId === undefined ||
    typeof candidate.playerId === "string";
  const validReady = candidate.ready === undefined ||
    typeof candidate.ready === "boolean";

  return validPlayerId && validReady;
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
    : error.code === "ROOM_NOT_WAITING"
    ? 409
    : 400;

  return Response.json({ error: error.code, message: error.message }, {
    status,
  });
}
