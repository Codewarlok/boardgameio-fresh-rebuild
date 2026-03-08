# API Cycle 1 - Lobby Base (Juego Princesa)

Base API para el flujo MVP del juego **Princesa**:

1. host abre sala,
2. obtiene ID de sala,
3. confirma número de jugadores,
4. se reparte baraja 1..21 entre jugadores.

## Estado

- Persistencia: `Map` en memoria (`utils/lobby.ts`).
- Alcance: dura mientras el proceso está vivo.
- No hay DB ni sincronización multi-instancia en este ciclo.

## Endpoints

### `POST /api/lobby/rooms`

Crea sala nueva para **Princesa**.

#### Request body (opcional)

```json
{
  "hostName": "Dio"
}
```

#### Response `201 Created`

```json
{
  "room": {
    "id": "A1B2C3D4",
    "game": "princesa",
    "status": "waiting",
    "maxPlayers": 2,
    "deckRemaining": [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
      20,
      21
    ],
    "players": [
      {
        "name": "Dio",
        "isHost": true,
        "hand": []
      }
    ]
  }
}
```

---

### `GET /api/lobby/rooms/:roomId`

Consulta estado de sala.

#### Response `200 OK`

Retorna objeto `room` completo.

#### Response `404 Not Found`

```json
{
  "message": "Room A1B2C3D4 not found"
}
```

---

### `POST /api/lobby/rooms/:roomId/start`

Confirma número de jugadores e inicia partida de Princesa repartiendo la baraja
(1..21).

#### Request body

```json
{
  "playerCount": 4
}
```

#### Response `200 OK`

Retorna `room` en estado `in_progress`, con `players[].hand` ya repartida y
`deckRemaining`.

#### Response `404 Not Found`

```json
{
  "error": "Room not found"
}
```

## Tipos y helpers

En `utils/lobby.ts`:

- `LobbyGameType`
- `LobbyRoomStatus`
- `LobbyPlayer`
- `LobbyRoom`
- `StartPrincesaRequest`
- `StartPrincesaResponse`
- `createMockRoom()`
- `getRoomById()`
- `startPrincesaGame()`
