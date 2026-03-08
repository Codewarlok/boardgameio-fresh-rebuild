# PRINCESA — Arquitectura Review Cycle 2

Fecha: 2026-03-07/08\
Proyecto: `/home/dio/.openclaw/workspace/projects/boardgame-fresh-rebuild`\
Célula: Arquitectura Princesa

## 1) Compatibilidad (API v1 vs implementación actual)

### 1.1 Resumen ejecutivo

- **Estado actual real**: implementación operativa de **Cycle 1** en rutas sin
  versionado (`/api/lobby/...`) con store en memoria (`Map`) y modelo
  `LobbyRoom` simplificado.
- **Estado objetivo Cycle 2**: contratos `v1` (`/api/v1/...`) + modelo de
  dominio ampliado (`Room`, `PlayerSeat`, `Match`, `RoundState`, `GameEvent`) +
  errores tipados + auth por asiento + control de concurrencia (`version`).
- **Conclusión**: la compatibilidad es **parcial y no transparente**. Hay base
  reutilizable, pero existe **brecha de contrato** suficiente para requerir capa
  de transición.

### 1.2 Matriz de compatibilidad de endpoints

| Contrato objetivo v1                        | Estado en código                                   | Compatibilidad                                        |
| ------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------- |
| `POST /api/v1/lobby/rooms`                  | Existe como `POST /api/lobby/rooms`                | **Parcial** (path/shape distinto)                     |
| `GET /api/v1/lobby/rooms/{roomCode}`        | Existe como `GET /api/lobby/rooms/{roomId}`        | **Parcial**                                           |
| `POST /api/v1/lobby/rooms/{roomCode}/join`  | No implementado                                    | **No compatible**                                     |
| `POST /api/v1/lobby/rooms/{roomCode}/ready` | No implementado                                    | **No compatible**                                     |
| `POST /api/v1/lobby/rooms/{roomCode}/start` | Existe como `POST /api/lobby/rooms/{roomId}/start` | **Parcial** (sin auth host/token ni guards de estado) |
| `POST /api/v1/game/rooms/{roomCode}/draw`   | No implementado                                    | **No compatible**                                     |
| `POST /api/v1/game/rooms/{roomCode}/play`   | No implementado                                    | **No compatible**                                     |
| `GET /api/v1/game/rooms/{roomCode}/events`  | No implementado                                    | **No compatible**                                     |

### 1.3 Matriz de compatibilidad de modelo de dominio

| Campo/objeto objetivo                        | Estado actual                       | Compatibilidad    |
| -------------------------------------------- | ----------------------------------- | ----------------- |
| `Room.code` + `Room.id` UUID                 | Solo `id` corto de 8 chars          | **Parcial**       |
| `Room.rulesVersion`                          | No existe                           | **No compatible** |
| `Room.version` (optimistic concurrency)      | No existe                           | **No compatible** |
| `PlayerSeat.ready`, `connected`, `tokenHash` | No existen                          | **No compatible** |
| `currentMatch`, `RoundState`, `scoreBoard`   | No existen                          | **No compatible** |
| `GameEvent[]`                                | No existe event log                 | **No compatible** |
| Estados (`round_finished`, `cancelled`)      | Solo `waiting/in_progress/finished` | **Parcial**       |

### 1.4 Compatibilidad hacia atrás (cliente actual)

- El frontend actual (`PrincesaLobby.tsx`) depende de:
  - rutas legacy `/api/lobby/...`,
  - `room.id` como código visible,
  - `players[].hand` y `deckRemaining` en la respuesta.
- Migrar directo a v1 **rompe** el cliente actual si no hay:
  1. adaptación de DTOs, y
  2. fallback/alias temporal en rutas legacy.

### 1.5 Estrategia recomendada de transición (sin ruptura)

1. Introducir `v1` como fuente oficial (`/api/v1/...`).
2. Mantener rutas legacy (`/api/lobby/...`) como **compat layer temporal**
   (deprecadas).
3. Traducir internamente legacy DTO -> dominio v1.
4. Publicar fecha de retiro de legacy cuando el frontend quede migrado.

---

## 2) Deuda técnica detectada

## 2.1 Deuda crítica (impacta escalabilidad/consistencia)

1. **Estado volátil en memoria (`Map`)**
   - pérdida total al reinicio;
   - no soporta multi-instancia.

2. **Acoplamiento HTTP <-> dominio**
   - `utils/lobby.ts` mezcla estado, reglas y DTO transport;
   - dificulta evolución a motor de juego real.

3. **Sin control de concurrencia**
   - sin `version`; riesgo de race conditions (doble start, updates pisados).

4. **Sin auth/autorización por asiento**
   - no hay `playerSessionToken` ni validación de host/jugador de turno.

5. **Errores inconsistentes**
   - coexisten `HttpError`, `{ error: ... }` y `{ message: ... }`.

## 2.2 Deuda media (impacta mantenibilidad/operación)

1. **Rutas no versionadas** (`/api/lobby/...`).
2. **Ausencia de event log de dominio** para auditoría/replay/realtime.
3. **Modelo de turno incompleto** (sin `Match`/`RoundState`).
4. **Idempotencia parcial** en comandos sensibles (`start`).
5. **Testing de dominio insuficiente** para invariantes del mazo y transiciones.

## 2.3 Deuda de frontend/contrato

1. UI de lobby consume forma de respuesta Cycle 1 (no v1).
2. No existe cliente tipado por contrato versionado.
3. No hay mecanismo de sincronización realtime (polling/SSE/WS).

---

## 3) Recomendaciones para Cycle 3 (persistencia + realtime)

## 3.1 Persistencia (prioridad alta)

### Objetivo

Pasar de estado efímero a estado durable sin romper contrato v1.

### Recomendación

- Implementar patrón **Repository** con interfaz estable:
  - `RoomRepository` (`create/get/updateWithVersion/listEvents/appendEvents`).
- Backend sugerido:
  - **Redis** para estado caliente + locks/versionado,
  - snapshots periódicos y/o persistencia de eventos.
- Regla de escritura:
  - `updateWithVersion(room, expectedVersion)` -> `VERSION_CONFLICT` si no
    coincide.

### Entregables mínimos

1. `infra/repositories/inmemory` (tests)
2. `infra/repositories/redis` (prod)
3. contrato de errores de infraestructura -> errores de dominio
4. TTL para salas inactivas + cleanup job

## 3.2 Realtime (prioridad alta)

### Objetivo

Sincronización de sala/partida near-real-time con reconexión robusta.

### Recomendación

- Adoptar **SSE** primero
  (`GET /api/v1/game/rooms/{code}/events?sinceVersion=`).
- Cada comando de dominio debe emitir `GameEvent[]` y avanzar `room.version`.
- Cliente debe:
  1. abrir stream SSE,
  2. aplicar eventos incrementales,
  3. rehidratar con snapshot en huecos de versión.

### Entregables mínimos

1. endpoint SSE por sala
2. persistencia de eventos por `version`
3. política de replay (últimos N eventos + snapshot)
4. estrategia de reconexión exponencial en frontend

## 3.3 Orden de implementación sugerido (Cycle 3)

1. **Contrato y dominio canónico v1** (sin legacy en core).
2. `version` + errores tipados + auth por asiento.
3. Repository abstraído + Redis.
4. Event log persistente.
5. SSE + cliente con replay/reconnect.
6. Decomisionar rutas legacy.

## 3.4 Quality gates recomendados para cerrar Cycle 3

- Integración API v1: create/join/ready/start/draw/play/events.
- Pruebas de concurrencia: conflictos por versión y reintentos idempotentes.
- Invariantes de cartas: `deck + hands + discards = 21`.
- Smoke multi-sala concurrente y reconexión SSE.

---

## 4) Decisión arquitectónica recomendada

- **Aprobar** alineación a contratos API v1 como baseline obligatorio.
- **Mantener** compatibilidad legacy solo como puente temporal.
- **Bloquear** nuevas features fuera de v1/domain canónico para evitar más
  deuda.

Resultado esperado: llegada a Cycle 3 con base estable para persistencia y
realtime, sin rehacer contratos nuevamente.
