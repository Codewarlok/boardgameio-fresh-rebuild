# API Cycle 1 - Lobby Base

Base API para lobby en memoria (mock), pensada para iterar flujo de sala en
ciclo inicial.

## Estado

- Persistencia: `Map` en memoria de proceso (`utils/lobby.ts`).
- Alcance: mientras el proceso del servidor esté vivo.
- No hay base de datos ni sincronización entre instancias.

## Endpoints

### `POST /api/lobby/rooms`

Crea una sala mock con un host inicial.

#### Request body (opcional)

```json
{
  "hostName": "Dio"
}
```

- Si no se envía JSON o `hostName`, se usa `"Host"` por defecto.

#### Response `201 Created`

```json
{
  "room": {
    "id": "A1B2C3D4",
    "status": "waiting",
    "createdAt": "2026-03-08T00:00:00.000Z",
    "updatedAt": "2026-03-08T00:00:00.000Z",
    "players": [
      {
        "id": "9d5d6f7a-...",
        "name": "Dio",
        "isHost": true,
        "joinedAt": "2026-03-08T00:00:00.000Z"
      }
    ]
  }
}
```

---

### `GET /api/lobby/rooms/:roomId`

Consulta el estado actual de una sala.

#### Response `200 OK`

```json
{
  "room": {
    "id": "A1B2C3D4",
    "status": "waiting",
    "createdAt": "2026-03-08T00:00:00.000Z",
    "updatedAt": "2026-03-08T00:00:00.000Z",
    "players": [
      {
        "id": "9d5d6f7a-...",
        "name": "Dio",
        "isHost": true,
        "joinedAt": "2026-03-08T00:00:00.000Z"
      }
    ]
  }
}
```

#### Response `404 Not Found`

```json
{
  "message": "Room A1B2C3D4 not found"
}
```

## Tipos compartidos

Definidos en `utils/lobby.ts`:

- `LobbyRoomStatus`
- `LobbyPlayer`
- `LobbyRoom`
- `CreateRoomRequest`
- `CreateRoomResponse`
- `GetRoomStateResponse`

Además se exponen helpers de dominio para ciclo mock:

- `createMockRoom(input?)`
- `getRoomById(roomId)`
