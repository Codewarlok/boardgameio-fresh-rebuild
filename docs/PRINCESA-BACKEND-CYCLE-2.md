# PRINCESA Backend Cycle 2 (BE-2)

Fecha: 2026-03-07 Proyecto: `boardgame-fresh-rebuild`

## Objetivo del ciclo

Implementar robustez de lobby para Princesa en backend:

1. join room real por nombre,
2. validación de límites de jugadores,
3. flujo ready/start con errores de dominio,
4. tests básicos de handlers.

## Cambios implementados

## 1) Dominio de lobby reforzado (`utils/lobby.ts`)

Se agregaron:

- `LobbyDomainError` con códigos:
  - `ROOM_NOT_FOUND`
  - `ROOM_NOT_WAITING`
  - `INVALID_PLAYER_NAME`
  - `PLAYER_NAME_TAKEN`
  - `ROOM_PLAYER_LIMIT_REACHED`
  - `INVALID_PLAYER_COUNT`
  - `NOT_ENOUGH_PLAYERS`
  - `PLAYER_NOT_FOUND`
  - `ONLY_HOST_CAN_START`
  - `PLAYERS_NOT_READY`
- Campo `isReady: boolean` en `LobbyPlayer`.
- Capacidad por defecto de sala: `maxPlayers = 8`.
- Helpers nuevos:
  - `joinRoom(roomId, playerName)`
  - `setPlayerReady(roomId, playerId, ready)`
  - `resetLobbyStoreForTests()`
- `startPrincesaGame(roomId, input)` ahora valida dominio antes de iniciar:
  - sala existente,
  - estado `waiting`,
  - host autorizado (si se envía `hostPlayerId`),
  - mínimo 2 jugadores,
  - `playerCount` (si se envía) debe coincidir con jugadores unidos,
  - todos los jugadores en `ready=true`.

## 2) Endpoint Join Room

Nuevo endpoint:

- `POST /api/lobby/rooms/:roomId/join`

Body:

```json
{ "playerName": "Ana" }
```

Respuesta exitosa:

- `201` con `{ room, player }`.

Errores de dominio mapeados a HTTP:

- `404` (`ROOM_NOT_FOUND`)
- `409` (`ROOM_NOT_WAITING`, `PLAYER_NAME_TAKEN`, `ROOM_PLAYER_LIMIT_REACHED`)
- `400` (ej. `INVALID_PLAYER_NAME`)

## 3) Endpoint Ready

Nuevo endpoint:

- `POST /api/lobby/rooms/:roomId/ready`

Body:

```json
{ "playerId": "...", "ready": true }
```

Respuesta:

- `200` con `{ room }`.

Errores de dominio:

- `404` (`ROOM_NOT_FOUND`)
- `409` (`ROOM_NOT_WAITING`)
- `400` (ej. `PLAYER_NOT_FOUND`)

## 4) Endpoint Start robusto

Endpoint actualizado:

- `POST /api/lobby/rooms/:roomId/start`

Body soportado:

```json
{ "hostPlayerId": "...", "playerCount": 2 }
```

Errores de dominio ahora normalizados:

- `404`: `ROOM_NOT_FOUND`
- `403`: `ONLY_HOST_CAN_START`
- `409`: `ROOM_NOT_WAITING`
- `400`: `NOT_ENOUGH_PLAYERS`, `INVALID_PLAYER_COUNT`, `PLAYERS_NOT_READY`, etc.

## 5) Tests básicos de handlers

Archivo:

- `routes/api/lobby/rooms/handlers_test.ts`

Cobertura básica:

- join exitoso agrega jugador por nombre,
- join bloquea cuando se supera límite,
- start falla con `PLAYERS_NOT_READY`,
- ready + start inicia juego correctamente.

## Notas

- Persistencia sigue siendo in-memory (`Map`), consistente con alcance MVP.
- El ciclo BE-2 deja el lobby listo para integrar autenticación por sesión y
  rutas versionadas en ciclos posteriores.
