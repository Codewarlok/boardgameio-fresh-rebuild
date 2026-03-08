export type LobbyRoomStatus = "waiting" | "in_progress" | "finished";
export type LobbyGameType = "princesa";

export type LobbyDomainErrorCode =
  | "ROOM_NOT_FOUND"
  | "ROOM_NOT_WAITING"
  | "INVALID_PLAYER_NAME"
  | "PLAYER_NAME_TAKEN"
  | "ROOM_PLAYER_LIMIT_REACHED"
  | "INVALID_PLAYER_COUNT"
  | "NOT_ENOUGH_PLAYERS"
  | "PLAYER_NOT_FOUND"
  | "ONLY_HOST_CAN_START"
  | "PLAYERS_NOT_READY";

export class LobbyDomainError extends Error {
  constructor(
    public readonly code: LobbyDomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "LobbyDomainError";
  }
}

export interface LobbyPlayer {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
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

export interface JoinRoomRequest {
  name?: string;
}

export interface SetReadyRequest {
  playerId?: string;
  ready?: boolean;
}

export interface StartPrincesaRequest {
  playerId?: string;
  playerCount?: number;
}

export interface CreateRoomResponse {
  room: LobbyRoom;
  playerId: string;
}

export interface JoinRoomResponse {
  room: LobbyRoom;
  playerId: string;
}

export interface SetReadyResponse {
  room: LobbyRoom;
}

export interface GetRoomStateResponse {
  room: LobbyRoom;
}

export interface StartPrincesaResponse {
  room: LobbyRoom;
}

export type LobbyRoomEventType =
  | "room_snapshot"
  | "room_created"
  | "player_joined"
  | "player_ready_changed"
  | "game_started";

export interface LobbyRoomEvent {
  type: LobbyRoomEventType;
  room: LobbyRoom;
  ts: string;
}

const DEFAULT_MAX_PLAYERS = 8;
const MIN_PLAYERS_TO_START = 2;
const roomStore = new Map<string, LobbyRoom>();
const roomWatchers = new Map<string, Set<(event: LobbyRoomEvent) => void>>();

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

function assertWaitingRoom(room: LobbyRoom): void {
  if (room.status !== "waiting") {
    throw new LobbyDomainError(
      "ROOM_NOT_WAITING",
      "Room must be in waiting status",
    );
  }
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function getRoomOrThrow(roomId: string): LobbyRoom {
  const room = roomStore.get(roomId);
  if (!room) {
    throw new LobbyDomainError("ROOM_NOT_FOUND", `Room ${roomId} not found`);
  }
  return room;
}

function emitRoomEvent(roomId: string, eventType: LobbyRoomEventType): void {
  const watchers = roomWatchers.get(roomId);
  const room = roomStore.get(roomId);
  if (!watchers || !room || watchers.size === 0) return;

  const event: LobbyRoomEvent = {
    type: eventType,
    room,
    ts: nowIso(),
  };

  for (const watcher of watchers) {
    watcher(event);
  }
}

function updateRoom(room: LobbyRoom, eventType: LobbyRoomEventType): LobbyRoom {
  const next = { ...room, updatedAt: nowIso() };
  roomStore.set(room.id, next);
  emitRoomEvent(room.id, eventType);
  return next;
}

export function subscribeRoomEvents(
  roomId: string,
  handler: (event: LobbyRoomEvent) => void,
): () => void {
  let watchers = roomWatchers.get(roomId);
  if (!watchers) {
    watchers = new Set();
    roomWatchers.set(roomId, watchers);
  }

  watchers.add(handler);

  return () => {
    const current = roomWatchers.get(roomId);
    if (!current) return;
    current.delete(handler);
    if (current.size === 0) {
      roomWatchers.delete(roomId);
    }
  };
}

export function createMockRoom(
  input: CreateRoomRequest = {},
): CreateRoomResponse {
  const now = nowIso();
  const roomId = createRoomId();
  const hostName = normalizeName(input.hostName ?? "Host") || "Host";
  const hostPlayerId = crypto.randomUUID();

  const room: LobbyRoom = {
    id: roomId,
    game: "princesa",
    status: "waiting",
    createdAt: now,
    updatedAt: now,
    maxPlayers: DEFAULT_MAX_PLAYERS,
    deckRemaining: createDeck21(),
    players: [{
      id: hostPlayerId,
      name: hostName,
      isHost: true,
      isReady: true,
      joinedAt: now,
      hand: [],
    }],
  };

  roomStore.set(roomId, room);
  emitRoomEvent(roomId, "room_created");

  return { room, playerId: hostPlayerId };
}

export function getRoomById(roomId: string): LobbyRoom | null {
  return roomStore.get(roomId) ?? null;
}

export function joinRoom(
  roomId: string,
  input: JoinRoomRequest,
): JoinRoomResponse {
  const room = getRoomOrThrow(roomId);
  assertWaitingRoom(room);

  const normalizedName = normalizeName(input.name ?? "");
  if (!normalizedName) {
    throw new LobbyDomainError(
      "INVALID_PLAYER_NAME",
      "Player name must not be empty",
    );
  }

  if (room.players.length >= room.maxPlayers) {
    throw new LobbyDomainError(
      "ROOM_PLAYER_LIMIT_REACHED",
      `Room ${roomId} reached max players (${room.maxPlayers})`,
    );
  }

  const duplicate = room.players.some((p) =>
    p.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase()
  );

  if (duplicate) {
    throw new LobbyDomainError(
      "PLAYER_NAME_TAKEN",
      `Player name '${normalizedName}' is already in room`,
    );
  }

  const playerId = crypto.randomUUID();
  const player: LobbyPlayer = {
    id: playerId,
    name: normalizedName,
    isHost: false,
    isReady: false,
    joinedAt: nowIso(),
    hand: [],
  };

  const nextRoom = updateRoom({
    ...room,
    players: [...room.players, player],
  }, "player_joined");

  return { room: nextRoom, playerId };
}

export function setPlayerReady(
  roomId: string,
  playerId: string,
  ready: boolean,
): LobbyRoom {
  const room = getRoomOrThrow(roomId);
  assertWaitingRoom(room);

  const idx = room.players.findIndex((p) => p.id === playerId);
  if (idx < 0) {
    throw new LobbyDomainError(
      "PLAYER_NOT_FOUND",
      `Player ${playerId} not found in room`,
    );
  }

  const players = room.players.map((player, i) =>
    i === idx ? { ...player, isReady: ready } : player
  );

  return updateRoom({ ...room, players }, "player_ready_changed");
}

export function startPrincesaGame(
  roomId: string,
  input: StartPrincesaRequest = {},
): LobbyRoom {
  const room = getRoomOrThrow(roomId);
  assertWaitingRoom(room);

  const host = room.players.find((p) => p.isHost);
  if (!host) {
    throw new LobbyDomainError("PLAYER_NOT_FOUND", "Host player not found");
  }

  if (input.playerId && input.playerId !== host.id) {
    throw new LobbyDomainError(
      "ONLY_HOST_CAN_START",
      "Only host can start the game",
    );
  }

  if (room.players.length < MIN_PLAYERS_TO_START) {
    throw new LobbyDomainError(
      "NOT_ENOUGH_PLAYERS",
      `At least ${MIN_PLAYERS_TO_START} players are required to start`,
    );
  }

  if (
    input.playerCount !== undefined && input.playerCount !== room.players.length
  ) {
    throw new LobbyDomainError(
      "INVALID_PLAYER_COUNT",
      `playerCount must match joined players (${room.players.length})`,
    );
  }

  const notReadyPlayers = room.players.filter((p) => !p.isReady);
  if (notReadyPlayers.length > 0) {
    throw new LobbyDomainError(
      "PLAYERS_NOT_READY",
      "All players must be ready before start",
    );
  }

  const players: LobbyPlayer[] = room.players.map((p) => ({ ...p, hand: [] }));
  const shuffled = shuffleDeck(createDeck21());
  const remaining = dealRoundRobin(shuffled, players);

  return updateRoom({
    ...room,
    players,
    status: "in_progress",
    deckRemaining: remaining,
  }, "game_started");
}

export function resetLobbyStoreForTests(): void {
  roomStore.clear();
  roomWatchers.clear();
}
