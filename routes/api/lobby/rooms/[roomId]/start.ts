import { define } from "@/utils.ts";
import {
  LobbyDomainError,
  startPrincesaGame,
  type StartPrincesaRequest,
  type StartPrincesaResponse,
} from "@/utils/lobby.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const roomId = ctx.params.roomId.toUpperCase();
    const body = await parseBody(ctx.req);

    try {
      const room = startPrincesaGame(roomId, body);
      const response: StartPrincesaResponse = { room };
      return Response.json(response, { status: 200 });
    } catch (error) {
      if (error instanceof LobbyDomainError) {
        return Response.json({ error: error.code, message: error.message }, {
          status: toStatus(error.code),
        });
      }

      return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
    }
  },
});

async function parseBody(req: Request): Promise<StartPrincesaRequest> {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return {};
  }

  try {
    const parsed = await req.json();
    if (isStartPrincesaRequest(parsed)) return parsed;
  } catch {
    // fallback
  }

  return {};
}

function isStartPrincesaRequest(value: unknown): value is StartPrincesaRequest {
  if (value === null || typeof value !== "object") return false;
  const candidate = value as { playerId?: unknown; playerCount?: unknown };
  const validHost = candidate.playerId === undefined ||
    typeof candidate.playerId === "string";
  const validCount = candidate.playerCount === undefined ||
    typeof candidate.playerCount === "number";
  return validHost && validCount;
}

function toStatus(code: LobbyDomainError["code"]): number {
  if (code === "ROOM_NOT_FOUND" || code === "PLAYER_NOT_FOUND") return 404;
  if (code === "INVALID_PLAYER_NAME" || code === "NOT_ENOUGH_PLAYERS") {
    return 400;
  }
  if (
    code === "ROOM_NOT_WAITING" || code === "ROOM_PLAYER_LIMIT_REACHED" ||
    code === "PLAYER_NAME_TAKEN" || code === "PLAYERS_NOT_READY" ||
    code === "INVALID_PLAYER_COUNT"
  ) return 409;
  if (code === "ONLY_HOST_CAN_START") return 403;
  return 400;
}
