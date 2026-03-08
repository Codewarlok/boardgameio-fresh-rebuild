# PRINCESA — Plan técnico ejecutable (Arquitectura + Implementación)

Fecha: 2026-03-07/08 (America/Santiago) Proyecto:
`/home/dio/.openclaw/workspace/projects/boardgame-fresh-rebuild` Rol:
Arquitectura (coordinación CTO + DevOps)

## 0) Estado actual detectado (implementación parcial)

### Implementado hoy

- UI base de lobby en `routes/lobby.tsx` + `islands/PrincesaLobby.tsx`.
- API base de lobby:
  - `POST /api/lobby/rooms` (crear sala)
  - `GET /api/lobby/rooms/:roomId` (estado sala)
  - `POST /api/lobby/rooms/:roomId/start` (iniciar y repartir 1..21)
- Modelo temporal en memoria (`Map`) en `utils/lobby.ts`.
- CI mínimo en GitHub Actions y build Fresh/Vite operativos.

### Gaps relevantes frente a objetivo “juego Princesa jugable”

1. No existe `join room` real (se autogeneran jugadores “Jugador N”).
2. Sin identidad de sesión/jugador (token de asiento).
3. Sin motor de turnos ni acciones de juego (solo reparto inicial).
4. Sin persistencia durable ni soporte multi-instancia (solo memoria proceso).
5. Sin sincronización en tiempo real (polling/manual).
6. Sin contratos explícitos para eventos de partida ni errores de dominio.
7. Validaciones de transición de estado aún débiles (idempotencia/concurrencia).

---

## 1) Objetivo de arquitectura

Entregar una arquitectura de sala para Princesa que soporte:

- lobby -> partida -> cierre de ronda/partida,
- flujo completo de cartas `1..21`,
- API estable para frontend y QA,
- despliegue progresivo: MVP en memoria, luego Redis/Postgres sin romper
  contratos.

Principio: **contratos primero** (API + dominio versionados), luego motor de
reglas.

---

## 2) Arquitectura de sala (target)

## 2.1 Contextos

- **LobbyContext**: creación sala, join/leave, ready, start.
- **GameContext (Princesa)**: turnos, cartas, efectos, eliminación, scoring.
- **RealtimeContext**: eventos de sala/partida por SSE (MVP) o WS (fase 3+).

## 2.2 Componentes

- `routes/api/lobby/*`: comandos de sala (HTTP).
- `routes/api/game/*`: comandos de juego (HTTP) + stream de eventos.
- `domain/princesa/*`: entidades, value objects, reglas puras.
- `infra/store/*`: implementación de repositorio (in-memory -> Redis/Postgres).

## 2.3 Estados de sala

- `waiting`: aceptando jugadores.
- `ready_check`: jugadores confirmando listos (opcional en fase 2).
- `in_progress`: partida activa.
- `round_finished`: ronda cerrada, puntajes actualizados.
- `finished`: partida cerrada (ganador final).
- `cancelled`: sala abortada por host/timeout.

Transiciones válidas (resumen):

- `waiting -> in_progress` (start válido)
- `in_progress -> round_finished` (mazo agotado o win condition)
- `round_finished -> in_progress` (siguiente ronda)
- `round_finished -> finished` (meta score)
- `waiting|in_progress -> cancelled`

---

## 3) Flujo de cartas 1..21 (ejecutable)

> Nota de arquitectura: para no bloquear desarrollo por reglas finas, se define
> flujo genérico + matriz de efectos versionable (`rulesVersion`).

## 3.1 Setup de ronda

1. Crear mazo `[1..21]`.
2. Barajar con `seed` persistida en estado de ronda (trazabilidad QA).
3. Reparto round-robin a `N` jugadores (N entre 2 y 8).
4. `deckRemaining` conserva sobrantes (siempre 0 con reparto total actual;
   configurable para variantes).
5. Estado inicial de turno: jugador índice 0 (host o random según
   configuración).

## 3.2 Ciclo de turno (v1)

1. `draw`: jugador roba del mazo si hay cartas.
2. `select-card`: jugador elige una carta de su mano para jugar.
3. `resolve-card`: se evalúa por número (1..21) usando `CardEffectResolver`.
4. `discard`: carta jugada pasa a descarte del jugador.
5. `advance-turn`: siguiente jugador activo.

## 3.3 Resolución de cartas 1..21

- Contrato de dominio mínimo:
  - `card.id` = 1..21
  - `card.rank` = 1..21
  - `card.effectKey` = `C1..C21` (mapping en `rules/princesa-v1.ts`)
- Cada efecto devuelve:
  - `events[]` (telemetría/UI)
  - `stateDelta` (mutación declarativa)
  - `validationErrors[]` (si acción inválida)

## 3.4 Cierre de ronda

La ronda termina cuando se cumple una condición:

- mazo sin cartas **y** todos sin jugada pendiente, o
- condición de victoria temprana definida por regla.

Desempate recomendado (v1):

1. mayor `rank` en mano,
2. mayor suma de descartes,
3. orden de turno (último criterio).

---

## 4) Fases de implementación

## Fase 1 — Endurecer lobby (1-2 días)

- Join real de jugadores.
- Token de asiento (playerSessionToken) por jugador.
- Validación fuerte de transiciones (`waiting` solamente para start).
- Idempotencia básica en start (no doble reparto).
- Tests API lobby + errores de dominio.

## Fase 2 — Motor Princesa v1 (2-4 días)

- Modelo de partida/ronda/turno completo.
- `play-card` y `draw-card` con validaciones.
- `CardEffectResolver` con 21 slots (`C1..C21`) y fallback seguro.
- Event log de ronda (`GameEvent[]`).
- Test de reglas + property tests simples (invariantes de mazo/cartas).

## Fase 3 — Realtime + UX jugable (2-3 días)

- Stream SSE por sala (`/api/game/rooms/:id/events`).
- UI de mesa y turnos en Fresh island.
- Reconexión cliente y sincronización por `version`.

## Fase 4 — Persistencia y despliegue (2-4 días)

- Repositorio Redis (estado caliente) + snapshot periódico.
- TTL de salas inactivas.
- Métricas mínimas (rooms_active, game_duration, error_rate).
- CD a Deno Deploy cuando credenciales estén listas.

---

## 5) Criterios de aceptación

## Funcionales

- Se puede crear, unir jugadores, iniciar partida y jugar turnos hasta cierre.
- Todas las cartas 1..21 pasan por resolver versionado (`C1..C21`).
- API rechaza acciones inválidas con errores de dominio tipados.

## Técnicos

- `deno task check` y `deno task build` en verde.
- Cobertura mínima sugerida: 80% en dominio de juego.
- Operación correcta con 10+ salas simultáneas (MVP in-memory) sin corrupción.

## DevOps/Operación

- Pipeline CI bloquea merges con gates rojos.
- Logs estructurados con `roomId`, `matchId`, `turn`.
- Checklist de release con smoke HTTP + smoke jugable.

---

## 6) Ajustes al código actual para alineación de plan

- Mantener `utils/lobby.ts` como base temporal, pero migrar a:
  - `domain/lobby/*`
  - `domain/princesa/*`
  - `infra/repositories/*`
- Separar DTO HTTP de entidades de dominio (evita acoplamiento).
- Agregar `version` a estado de sala para sincronización cliente/retry.

### Riesgos de no ajustar

- Errores por concurrencia/reintento de requests.
- Dificultad para escalar a multi-instancia.
- Alta deuda técnica al introducir reglas completas del juego.

---

## 7) Decisiones de arquitectura (TDR corto)

1. **ADR-PRIN-001**: contratos API versionados (`/api/v1/...`) desde Fase 2.
2. **ADR-PRIN-002**: resolver de cartas por tabla (`effectKey`) en vez de
   `switch` monolítico.
3. **ADR-PRIN-003**: SSE primero (simple), WS después si la latencia/escala lo
   exige.
4. **ADR-PRIN-004**: in-memory en Fase 1-2; Redis para Fase 4 sin romper
   contratos.

---

## 8) Entrega coordinada CTO + DevOps

- CTO valida reglas finales de cartas `C1..C21` (texto canónico por carta).
- DevOps habilita entorno con secretos deploy y monitoreo básico.
- Arquitectura bloquea cambios ad-hoc fuera de contratos para proteger
  velocidad.
