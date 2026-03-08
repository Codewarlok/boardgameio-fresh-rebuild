import { define } from "@/utils.ts";
import {
  createMockRoom,
  type CreateRoomRequest,
  type CreateRoomResponse,
} from "@/utils/lobby.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const body = await parseBody(ctx.req);
    const room = createMockRoom(body);

    const response: CreateRoomResponse = { room };
    return Response.json(response, { status: 201 });
  },
});

async function parseBody(req: Request): Promise<CreateRoomRequest> {
  const contentType = req.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return {};
  }

  try {
    const parsed = await req.json();

    if (isCreateRoomRequest(parsed)) {
      return parsed;
    }
  } catch {
    // Fallback to default payload.
  }

  return {};
}

function isCreateRoomRequest(value: unknown): value is CreateRoomRequest {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const candidate = value as { hostName?: unknown };
  return (
    candidate.hostName === undefined || typeof candidate.hostName === "string"
  );
}
