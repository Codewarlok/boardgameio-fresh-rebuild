# PRINCESA — Lista de tareas para implementación inmediata

Horizonte: próximos 3-5 días Prioridad: P0/P1 (bloquea MVP jugable)

## P0 — Contratos y dominio base

- [ ] Crear carpeta `domain/princesa` con tipos: `Room`, `PlayerSeat`, `Match`,
      `RoundState`, `GameEvent`.
- [ ] Definir `errors.ts` con códigos de dominio estandarizados.
- [ ] Introducir `version` en estado de sala para control de concurrencia.
- [ ] Versionar rutas nuevas en `/api/v1/*`.

## P0 — Lobby real

- [ ] Implementar `POST /api/v1/lobby/rooms/{code}/join`.
- [ ] Implementar token de sesión por jugador (Bearer token).
- [ ] Implementar `ready` por jugador.
- [ ] Restringir `start` a host + validación `status=waiting`.
- [ ] Hacer `start` idempotente (misma respuesta si ya inició con misma
      versión).

## P0 — Motor de juego mínimo

- [ ] Implementar `RoundState` con mazo 1..21, manos, descartes, turno.
- [ ] Endpoint `POST /api/v1/game/rooms/{code}/draw`.
- [ ] Endpoint `POST /api/v1/game/rooms/{code}/play`.
- [ ] Crear `CardEffectResolver` con tabla `C1..C21` (scaffold + TODO por
      efecto).
- [ ] Emitir `GameEvent[]` en cada comando.

## P1 — Frontend jugable

- [ ] Extender `PrincesaLobby.tsx` para join real por código + nombre.
- [ ] Crear island `PrincesaTable.tsx` con:
  - estado de turno,
  - mano del jugador,
  - botón jugar carta,
  - historial de eventos.
- [ ] Sincronización por polling corto (fallback) y luego SSE.

## P1 — QA + DevOps

- [ ] Agregar tests de integración API (crear/join/start/draw/play).
- [ ] Agregar test de invariante: cartas totales siempre 21
      (deck+hands+discards).
- [ ] Añadir smoke CI para `/lobby` y endpoints `v1`.
- [ ] Preparar variables/secretos para deploy y checklist release.

## Gaps específicos detectados hoy

1. No existe join real de jugadores.
2. No existe autenticación/autorización por asiento.
3. No hay eventos realtime.
4. No hay persistencia durable.
5. Rutas actuales no están versionadas (`/api/v1`).

## Criterio de “done” inmediato

- Flujo mínimo completo en staging: crear sala -> unir 2+ jugadores -> start ->
  1 ronda con turnos y play card -> cierre de ronda con ganador y eventos
  visibles.
