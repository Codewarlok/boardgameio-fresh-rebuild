import { define } from "@/utils.ts";
import {
  startPrincesaGame,
  type StartPrincesaRequest,
  type StartPrincesaResponse,
} from "@/utils/lobby.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const roomId = ctx.params.roomId.toUpperCase();
    const body = await parseBody(ctx.req);

    const room = startPrincesaGame(roomId, body.playerCount);
    if (!room) {
      return Response.json({ error: "Room not found" }, { status: 404 });
    }

    const response: StartPrincesaResponse = { room };
    return Response.json(response, { status: 200 });
  },
});

async function parseBody(req: Request): Promise<StartPrincesaRequest> {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return { playerCount: 2 };
  }

  try {
    const parsed = await req.json();
    if (isStartPrincesaRequest(parsed)) return parsed;
  } catch {
    // fallback
  }

  return { playerCount: 2 };
}

function isStartPrincesaRequest(value: unknown): value is StartPrincesaRequest {
  if (value === null || typeof value !== "object") return false;
  const candidate = value as { playerCount?: unknown };
  return typeof candidate.playerCount === "number";
}
