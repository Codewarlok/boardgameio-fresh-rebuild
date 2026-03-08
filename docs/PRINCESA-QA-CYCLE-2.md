# PRINCESA — QA Cycle 2

Fecha: 2026-03-08 (America/Santiago) Proyecto:
`/home/dio/.openclaw/workspace/projects/boardgame-fresh-rebuild`

## 1) Casos de prueba Cycle 2 (create / join / start)

> Objetivo: validar flujo lobby de Cycle 2 + manejo de errores de dominio.

| ID         | Flujo  | Caso                                                      | Esperado                                         | Estado actual                                     |
| ---------- | ------ | --------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------- |
| C2-CRT-01  | create | `POST /api/lobby/rooms` con `{hostName}` válido           | `201` + body con `room` completo + `player/host` | ❌ `201` pero body `{}`                           |
| C2-CRT-02  | create | `POST /api/lobby/rooms` sin JSON (`text/plain`)           | `201` con defaults seguros (host fallback)       | ⚠️ No verificable por body vacío                  |
| C2-JOIN-01 | join   | `POST /api/lobby/rooms/{id}/join` con `playerName` válido | `200` + jugador agregado                         | ❌ `404 Not Found` (ruta no operativa en runtime) |
| C2-JOIN-02 | join   | nombre duplicado (case-insensitive)                       | `400` con código `PLAYER_NAME_TAKEN`             | ❌ Bloqueado por `404` de ruta join               |
| C2-JOIN-03 | join   | nombre vacío/blank                                        | `400` con `INVALID_PLAYER_NAME`                  | ❌ Bloqueado por `404` de ruta join               |
| C2-STR-01  | start  | host inicia con sala válida (>=2 jugadores listos)        | `200` + `room.status=in_progress`                | ❌ Bloqueado (sin roomId usable desde create)     |
| C2-STR-02  | start  | room inexistente                                          | `404` + `ROOM_NOT_FOUND`                         | ✅ Verificado                                     |
| C2-STR-03  | start  | no-host intenta iniciar                                   | `403` + `ONLY_HOST_CAN_START`                    | ⚠️ No verificable por bloqueo de create/join      |
| C2-STR-04  | start  | sala no waiting                                           | `409` + `ROOM_NOT_WAITING`                       | ⚠️ No verificable en smoke HTTP                   |
| C2-STR-05  | start  | jugadores no listos                                       | `400` + `PLAYERS_NOT_READY`                      | ⚠️ No verificable (ruta ready también bloqueada)  |

Resumen ejecución HTTP manual: **1 OK / 5 FAIL / 4 bloqueados**.

---

## 2) Matriz de errores de dominio (Cycle 2)

Fuente: `utils/lobby.ts` + handlers API.

| Código de dominio           | Disparador esperado                            | HTTP esperado                                         |
| --------------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| `ROOM_NOT_FOUND`            | roomId inexistente                             | `404`                                                 |
| `ROOM_NOT_WAITING`          | intento de join/ready/start fuera de `waiting` | `409` en start (join/ready sin mapeo consistente aún) |
| `INVALID_PLAYER_NAME`       | `playerName` vacío/solo espacios               | `400`                                                 |
| `PLAYER_NAME_TAKEN`         | nombre ya usado en sala                        | `400`                                                 |
| `ROOM_PLAYER_LIMIT_REACHED` | sala al límite de jugadores                    | `400`                                                 |
| `INVALID_PLAYER_COUNT`      | `playerCount` no coincide con jugadores unidos | `400`                                                 |
| `NOT_ENOUGH_PLAYERS`        | iniciar con <2 jugadores                       | `400`                                                 |
| `PLAYER_NOT_FOUND`          | `playerId` inexistente (ready/start host)      | `400`                                                 |
| `ONLY_HOST_CAN_START`       | no-host inicia partida                         | `403`                                                 |
| `PLAYERS_NOT_READY`         | hay jugadores `ready=false` al iniciar         | `400`                                                 |

### Observación QA crítica

Hay **drift de contrato** entre rutas y dominio:

- `routes/api/lobby/rooms/index.ts` espera que `createMockRoom()` retorne
  `{ room, playerId }`, pero en dominio retorna solo `LobbyRoom`.
- Resultado real observado: `POST /api/lobby/rooms` responde `201` con `{}`.
- `join`/`ready` existen en árbol de código, pero en flujo HTTP smoke siguen
  devolviendo `404`.

---

## 3) Checklist de release — Cycle 2

### Gate técnico

- [x] `deno task build` en verde.
- [ ] `deno task check` en verde.\
      Falla en `fmt --check` (múltiples archivos) y se detecta inconsistencia
      estructural en `utils/lobby.ts` (duplicación de
      `resetLobbyStoreForTests`).

### API ciclo 2

- [ ] Create retorna contrato correcto (`room` + metadata host/session según
      diseño).
- [ ] Join disponible y operativa (`200` en happy path).
- [ ] Ready disponible y operativa.
- [ ] Start happy path operativo end-to-end.
- [x] Start con sala inexistente retorna `ROOM_NOT_FOUND`.
- [ ] Errores de dominio consistentes en todas las rutas (`{ error, message }`).

### Frontend / flujo usuario

- [x] `GET /lobby` responde `200`.
- [ ] Flujo UI completo create -> join -> ready -> start validado en navegador.

### Evidencia / trazabilidad

- [x] Documento QA Cycle 2 creado.
- [x] Evidencia de smoke HTTP incluida.
- [x] Riesgos de release identificados.

**Recomendación QA:** ❌ **No liberar Cycle 2** hasta cerrar discrepancias
create/join/ready/start.

---

## 4) Smoke manual con evidencia

### 4.1 Entorno de ejecución

Comandos:

```bash
deno task build
deno serve -A --port 8010 _fresh/server.js
```

> Nota: puerto `8000` estaba ocupado por otra instancia previa; se usó `8010`
> para smoke aislado.

### 4.2 Evidencia HTTP (extracto)

```bash
GET / -> 200
GET /lobby -> 200

POST /api/lobby/rooms (hostName=HostQA)
HTTP/1.1 201 Created
body: {}

POST /api/lobby/rooms/{roomId}/join
HTTP/1.1 404 Not Found
body: Not Found

POST /api/lobby/rooms/{roomId}/start (room inexistente)
HTTP/1.1 404 Not Found
body: {"error":"ROOM_NOT_FOUND","message":"Room XXXX0000 not found"}
```

### 4.3 Hallazgos QA

- **H1 (Alta):** `create` devuelve `{}` en vez del contrato esperado.
- **H2 (Alta):** rutas `join`/`ready` no operativas en runtime smoke (`404`).
- **H3 (Alta):** sin create/join funcional no se puede validar `start` happy
  path real.
- **H4 (Media):** `check` no pasa (`fmt --check`) y hay señales de merge
  inconsistente en dominio.

---

## 5) Acciones sugeridas (prioridad)

1. Corregir contrato `create` (alinear handler con retorno de `createMockRoom` o
   viceversa).
2. Validar inclusión efectiva de rutas `join`/`ready` en runtime y sus handlers.
3. Ejecutar `deno fmt` + `deno task check` hasta verde.
4. Repetir smoke E2E completo: `create -> join -> ready -> start` con evidencia
   final de release.
