export type LobbyRoomStatus = "waiting" | "in_progress" | "finished";
export type LobbyGameType = "princesa";

export interface LobbyPlayer {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: string;
  hand: number[];
}

export interface LobbyRoom {
  id: string;
  game: LobbyGameType;
  status: LobbyRoomStatus;
  createdAt: string;
  updatedAt: string;
  players: LobbyPlayer[];
  maxPlayers: number;
  deckRemaining: number[];
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

export interface StartPrincesaRequest {
  playerCount: number;
}

export interface StartPrincesaResponse {
  room: LobbyRoom;
}

const roomStore = new Map<string, LobbyRoom>();

function createRoomId(): string {
  return crypto.randomUUID().slice(0, 8).toUpperCase();
}

function nowIso(): string {
  return new Date().toISOString();
}

function createDeck21(): number[] {
  return Array.from({ length: 21 }, (_, i) => i + 1);
}

function shuffleDeck(deck: number[]): number[] {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function dealRoundRobin(deck: number[], players: LobbyPlayer[]): number[] {
  const working = [...deck];
  let idx = 0;
  while (working.length > 0) {
    const card = working.shift();
    if (card === undefined) break;
    players[idx].hand.push(card);
    idx = (idx + 1) % players.length;
  }
  return working;
}

export function createMockRoom(input: CreateRoomRequest = {}): LobbyRoom {
  const now = nowIso();
  const roomId = createRoomId();
  const hostName = input.hostName?.trim() || "Host";

  const room: LobbyRoom = {
    id: roomId,
    game: "princesa",
    status: "waiting",
    createdAt: now,
    updatedAt: now,
    maxPlayers: 2,
    deckRemaining: createDeck21(),
    players: [
      {
        id: crypto.randomUUID(),
        name: hostName,
        isHost: true,
        joinedAt: now,
        hand: [],
      },
    ],
  };

  roomStore.set(roomId, room);
  return room;
}

export function getRoomById(roomId: string): LobbyRoom | null {
  return roomStore.get(roomId) ?? null;
}

export function startPrincesaGame(
  roomId: string,
  playerCount: number,
): LobbyRoom | null {
  const room = roomStore.get(roomId);
  if (!room) return null;

  const safePlayerCount = Math.max(2, Math.min(8, Math.floor(playerCount)));

  const players: LobbyPlayer[] = room.players.map((p) => ({ ...p, hand: [] }));

  for (let i = players.length; i < safePlayerCount; i++) {
    players.push({
      id: crypto.randomUUID(),
      name: `Jugador ${i + 1}`,
      isHost: false,
      joinedAt: nowIso(),
      hand: [],
    });
  }

  const shuffled = shuffleDeck(createDeck21());
  const remaining = dealRoundRobin(shuffled, players);

  const updatedRoom: LobbyRoom = {
    ...room,
    players,
    maxPlayers: safePlayerCount,
    status: "in_progress",
    deckRemaining: remaining,
    updatedAt: nowIso(),
  };

  roomStore.set(roomId, updatedRoom);
  return updatedRoom;
}
