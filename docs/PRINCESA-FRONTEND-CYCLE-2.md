# PRINCESA-FRONTEND-CYCLE-2

## Objetivo del ciclo FE-2

Implementar el flujo real de lobby para:

- unirse a sala con nombre,
- ver lista real de jugadores,
- controlar ready/start según respuestas API,
- mostrar feedback de carga y errores.

## Cambios implementados

### 1) UI de unión a sala con nombre

Archivo: `islands/PrincesaLobby.tsx`

- Se agregó bloque **Unirse a sala** con:
  - código de sala,
  - nombre del jugador,
  - acción `Unirme`.
- La acción consume `POST /api/lobby/rooms/:roomId/join`.
- Al unirse, se guarda `playerId` retornado por API para controlar ready/start
  desde el cliente actual.

### 2) Lista real de jugadores

Archivo: `islands/PrincesaLobby.tsx`

- Se reemplazó el estado mock por render sobre `room.players` real.
- Cada jugador muestra:
  - nombre,
  - etiqueta `(host)` cuando aplica,
  - estado ready,
  - mano (vacía antes de iniciar / cartas tras start).

### 3) Control ready/start ligado a API

Archivos:

- `islands/PrincesaLobby.tsx`
- `routes/api/lobby/rooms/[roomId]/ready.ts`
- `routes/api/lobby/rooms/[roomId]/start.ts`
- `routes/api/lobby/rooms/[roomId]/join.ts`
- `routes/api/lobby/rooms/index.ts`
- `utils/lobby.ts`

Implementado:

- **Ready**
  - Botón de toggle (`Marcar ready` / `Quitar ready`).
  - Consume `POST /ready` con `playerId` y `ready`.
  - Actualiza estado desde respuesta API.

- **Start**
  - Solo habilitado para host cuando:
    - sala en `waiting`,
    - hay al menos 2 jugadores,
    - todos están ready.
  - Consume `POST /start` con `playerId` del host.
  - Si API responde error de dominio (por ejemplo `PLAYERS_NOT_READY`), se
    refleja en UI.

### 4) Feedback de carga y errores

Archivo: `islands/PrincesaLobby.tsx`

- Estado `loadingAction` para bloquear acciones concurrentes y mostrar texto de
  progreso:
  - `Creando...`, `Uniéndose...`, `Guardando...`, `Iniciando...`,
    `Actualizando...`.
- Mensajes de error provenientes de API (`error`/`message`) mostrados en rojo.
- Mensajes de éxito/estado mostrados en verde (`notice`).

### 5) Ajustes de dominio/API para FE-2

Archivo: `utils/lobby.ts`

- Tipos y payloads alineados con FE-2:
  - `CreateRoomResponse` con `playerId` host.
  - `JoinRoomResponse` con `playerId` del jugador unido.
  - `SetReadyRequest` y `StartPrincesaRequest` por `playerId`.
- Se mantiene validación de reglas de dominio:
  - sala existente,
  - sala en waiting,
  - mínimo de jugadores,
  - todos ready,
  - solo host puede iniciar.

También se ajustaron handlers de API para serializar errores de dominio de forma
consistente.

## Validaciones ejecutadas

- `deno task check` ✅
- `deno task build` ✅

## Nota

Durante `build` aparece advertencia informativa de dependencia
`baseline-browser-mapping` desactualizada (no bloqueante). El build finaliza
correctamente.
