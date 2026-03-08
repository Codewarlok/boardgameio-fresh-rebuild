# PRINCESA — Propuesta final de contratos API + modelo de dominio

Fecha: 2026-03-07/08 Versión propuesta: `v1`

## 1) Convenciones

- Base path: `/api/v1`
- Content-Type: `application/json`
- Timestamps: ISO-8601 UTC
- Identificadores: UUID (externamente se puede exponer short code para room)
- Concurrencia optimista: campo `version` en recursos mutables

## 2) Modelo de dominio final (resumen)

```ts
export type RoomStatus =
  | "waiting"
  | "in_progress"
  | "round_finished"
  | "finished"
  | "cancelled";

export interface Room {
  id: string;
  code: string; // código corto visible
  game: "princesa";
  status: RoomStatus;
  hostPlayerId: string;
  rulesVersion: "princesa-v1";
  players: PlayerSeat[];
  currentMatch: Match | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PlayerSeat {
  playerId: string;
  name: string;
  isHost: boolean;
  connected: boolean;
  ready: boolean;
  joinedAt: string;
  tokenHash: string; // no exponer token plano
}

export interface Match {
  matchId: string;
  round: RoundState;
  scoreBoard: Record<string, number>;
  winnerPlayerId?: string;
}

export interface RoundState {
  roundId: string;
  turn: number;
  currentPlayerId: string;
  deck: number[]; // top en índice 0
  hands: Record<string, number[]>;
  discards: Record<string, number[]>;
  eliminatedPlayerIds: string[];
  seed: string;
  events: GameEvent[];
}

export interface GameEvent {
  id: string;
  at: string;
  type:
    | "room_created"
    | "player_joined"
    | "game_started"
    | "card_drawn"
    | "card_played"
    | "card_resolved"
    | "turn_advanced"
    | "round_finished"
    | "game_finished";
  roomId: string;
  matchId?: string;
  actorPlayerId?: string;
  payload: Record<string, unknown>;
}
```

## 3) Contratos API propuestos

## 3.1 Lobby

### `POST /api/v1/lobby/rooms`

Crea sala.

Request:

```json
{ "hostName": "Dio" }
```

Response `201`:

```json
{
  "room": {
    "id": "uuid",
    "code": "A1B2C3D4",
    "game": "princesa",
    "status": "waiting",
    "hostPlayerId": "uuid",
    "rulesVersion": "princesa-v1",
    "players": [
      {
        "playerId": "uuid",
        "name": "Dio",
        "isHost": true,
        "connected": true,
        "ready": false,
        "joinedAt": "..."
      }
    ],
    "currentMatch": null,
    "version": 1,
    "createdAt": "...",
    "updatedAt": "..."
  },
  "hostSessionToken": "opaque-token"
}
```

### `POST /api/v1/lobby/rooms/{roomCode}/join`

Jugador se une.

Request:

```json
{ "playerName": "Nyx" }
```

Response `200`: `{ room, playerSessionToken }`

### `GET /api/v1/lobby/rooms/{roomCode}`

Estado sala (sin secretos).

### `POST /api/v1/lobby/rooms/{roomCode}/ready`

Marca jugador listo.

Request:

```json
{ "ready": true }
```

Header requerido: `Authorization: Bearer <playerSessionToken>`

### `POST /api/v1/lobby/rooms/{roomCode}/start`

Inicia partida (solo host, sala waiting, min 2 jugadores).

Request opcional:

```json
{ "seed": "optional-seed" }
```

Response `200`: `{ room }`

## 3.2 Gameplay

### `POST /api/v1/game/rooms/{roomCode}/draw`

Roba carta (jugador de turno).

Response `200`:

```json
{ "room": { "...": "..." }, "event": { "type": "card_drawn" } }
```

### `POST /api/v1/game/rooms/{roomCode}/play`

Juega carta.

Request:

```json
{ "card": 14, "targetPlayerId": "uuid-opcional", "meta": {} }
```

Response `200`:

```json
{
  "room": { "...": "..." },
  "events": [
    { "type": "card_played" },
    { "type": "card_resolved" },
    { "type": "turn_advanced" }
  ]
}
```

### `GET /api/v1/game/rooms/{roomCode}/events?sinceVersion=12`

SSE recomendado (`text/event-stream`) para updates realtime.

## 4) Errores de dominio (estándar)

Formato:

```json
{
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "Cannot start game when room is in_progress",
    "details": { "expected": "waiting", "actual": "in_progress" }
  }
}
```

Códigos mínimos:

- `ROOM_NOT_FOUND`
- `UNAUTHORIZED_PLAYER`
- `INVALID_STATE_TRANSITION`
- `NOT_PLAYER_TURN`
- `INVALID_CARD_PLAY`
- `PLAYER_NOT_IN_ROOM`
- `ROOM_FULL`
- `VERSION_CONFLICT`

## 5) Reglas de compatibilidad

- Cambios no rompientes: agregar campos opcionales/eventos nuevos.
- Cambios rompientes: nueva versión de ruta (`/api/v2`).
- Frontend debe ignorar campos desconocidos.

## 6) Mapeo de implementación actual -> propuesta

Actual:

- `/api/lobby/rooms` ✅ base útil
- `/api/lobby/rooms/:roomId` ✅ base útil
- `/api/lobby/rooms/:roomId/start` ✅ base útil

Falta para llegar al contrato final:

- versionado `/api/v1`
- join/ready/draw/play/events
- auth por token de asiento
- objeto `Match/RoundState` completo
- errores tipados consistentes
