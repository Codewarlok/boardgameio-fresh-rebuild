export type LobbyRoomStatus = "waiting" | "in_progress" | "finished";

export interface LobbyPlayer {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: string;
}

export interface LobbyRoom {
  id: string;
  status: LobbyRoomStatus;
  createdAt: string;
  updatedAt: string;
  players: LobbyPlayer[];
}

export interface CreateRoomRequest {
  hostName?: string;
}

export interface CreateRoomResponse {
  room: LobbyRoom;
}

export interface GetRoomStateResponse {
  room: LobbyRoom;
}

const roomStore = new Map<string, LobbyRoom>();

function createRoomId(): string {
  return crypto.randomUUID().slice(0, 8).toUpperCase();
}

export function createMockRoom(input: CreateRoomRequest = {}): LobbyRoom {
  const now = new Date().toISOString();
  const roomId = createRoomId();
  const hostName = input.hostName?.trim() || "Host";

  const room: LobbyRoom = {
    id: roomId,
    status: "waiting",
    createdAt: now,
    updatedAt: now,
    players: [
      {
        id: crypto.randomUUID(),
        name: hostName,
        isHost: true,
        joinedAt: now,
      },
    ],
  };

  roomStore.set(roomId, room);
  return room;
}

export function getRoomById(roomId: string): LobbyRoom | null {
  return roomStore.get(roomId) ?? null;
}
