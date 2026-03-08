# PRINCESA-CTO-PLAN

Fecha: 2026-03-07/08 (America/Santiago)\
Proyecto: `boardgame-fresh-rebuild`\
Responsable: CDO/CTO estratégico (Dio)\
Insumos usados: `API-CYCLE-1.md`, `FRONTEND-CYCLE-1.md`,
`DEVOPS-SUPERVISION-REPORT.md`, `QA-CYCLE-1.md`, validación técnica actual.

## 1) Alcance (MVP Princesa)

### In scope (obligatorio)

1. Abrir sala desde UI/API.
2. Generar y exponer ID de sala.
3. Confirmar número de jugadores (2..8).
4. Iniciar partida repartiendo baraja 1..21 entre jugadores.
5. Visualizar estado mínimo de sala: estado, jugadores, mano, cartas restantes.

### Out of scope (este ciclo)

- Persistencia en DB.
- Multi-instancia y sincronización distribuida.
- Join real de jugadores remotos autenticados.
- Reglas avanzadas del juego Princesa (más allá del reparto inicial).

---

## 2) Prioridades estratégicas

### P0 — Funcionalidad núcleo (Go-live técnico)

- Endpoints lobby (crear, consultar, iniciar).
- Ruta `/lobby` operativa.
- Integridad de reparto de cartas 1..21.

### P1 — Confiabilidad y control de calidad

- Gate CI obligatorio: `fmt`, `lint`, `check`, `build`.
- Smoke manual/automatizable del flujo crítico Princesa.

### P2 — Endurecimiento pre-producción

- Persistencia y diseño multi-sala robusto.
- Seguridad básica API (rate limiting, validación extendida).
- Observabilidad de errores y métricas de juego.

---

## 3) Riesgos y mitigación

1. **Estado en memoria (alto)**
   - Riesgo: pérdida de salas al reiniciar proceso; no escala horizontal.
   - Mitigación: fase siguiente con repositorio persistente (Redis/DB) y TTL.

2. **Desalineación runtime vs código (medio)**
   - Riesgo: procesos viejos en puerto 8000 pueden dar respuestas obsoletas.
   - Mitigación: runbook DevOps para puertos/procesos y healthcheck de versión.

3. **Cobertura QA incompleta en UI interactiva (medio)**
   - Riesgo: regresiones visuales/UX en lobby.
   - Mitigación: smoke UI automatizado + checklist manual mínimo por release.

4. **Ausencia de reglas de negocio completas de Princesa (bajo por alcance
   actual)**
   - Riesgo: stakeholders asuman juego completo cuando hoy es MVP de lobby+deal.
   - Mitigación: definición explícita de alcance y Done por fase.

---

## 4) Hitos y plan por fases

## Fase 0 — Base MVP (cerrar ciclo actual)

**Objetivo:** Flujo Princesa usable de punta a punta en ambiente local.

Entregables:

- UI `/lobby` con creación e inicio de partida.
- API `/api/lobby/rooms`, `/api/lobby/rooms/:roomId`,
  `/api/lobby/rooms/:roomId/start`.
- Reparto 1..21 validado.
- CI en verde.

### Go/No-Go Fase 0

**GO** si:

- `/lobby` = 200.
- Crear sala retorna 201 con `room.id`.
- Consulta por ID retorna 200.
- Start con `playerCount` retorna 200 y `players.length` correcto.
- Unión de cartas en manos + `deckRemaining` == `[1..21]` sin
  pérdidas/duplicados.
- `deno task check` y `deno task build` en verde.

**NO-GO** si falla cualquier condición anterior.

## Fase 1 — Hardening técnico

**Objetivo:** pasar de demo funcional a servicio confiable.

Entregables:

- Persistencia de salas (Redis/DB) con expiración.
- Validaciones de entrada y errores estandarizados.
- Smoke tests automáticos del flujo crítico.
- Runbook de despliegue/rollback.

### Go/No-Go Fase 1

**GO** si:

- Reinicio de servicio no rompe consistencia mínima definida.
- Tests de API críticos pasan en CI.
- Observabilidad mínima (logs estructurados + errores trazables) activa.

**NO-GO** si persistencia o tests críticos no están operativos.

## Fase 2 — Pre-producción funcional

**Objetivo:** habilitar uso real multiusuario básico.

Entregables:

- Join real de jugadores por ID.
- Confirmación de jugadores por host con estado sincronizado.
- Seguridad base (rate limit + saneamiento payload).

### Go/No-Go Fase 2

**GO** si:

- 2+ clientes pueden unirse a una misma sala con consistencia de estado.
- No hay pérdida de estado en escenarios de concurrencia básicos.
- Controles de abuso básicos activos.

**NO-GO** si hay inconsistencia de jugadores/sala bajo uso concurrente.

---

## 5) Definición de Done (DoD)

Una fase se considera **Done** cuando cumple simultáneamente:

1. Criterios funcionales definidos para la fase.
2. Evidencia técnica reproducible (comandos/smoke/reportes).
3. CI en verde sin bypass.
4. Riesgos residuales documentados y aceptados por coordinación (Nyx/Dio).
5. Documentación actualizada en `docs/`.

---

## 6) Validación final del pedido de Dio (estado actual)

Pedido a validar:

- abrir sala,
- ID de sala,
- confirmar jugadores,
- repartir baraja 1..21.

Validación ejecutada (runtime local sobre build actual en puerto 8010):

- `GET /` => **200**
- `GET /lobby` => **200**
- `POST /api/lobby/rooms` => **201**, `room.id` de 8 chars (**OK**)
- `GET /api/lobby/rooms/{id}` => **200**, mismo ID (**OK**)
- `POST /api/lobby/rooms/{id}/start` con `playerCount=4` => **200**,
  `players.length=4` (**OK**)
- Integridad baraja: manos + `deckRemaining` = `[1..21]` (**OK**)

Resultado de cumplimiento del pedido: **CUMPLE (Fase 0 GO)**.

---

## 7) Cierre estratégico CTO/CDO

- **Decisión actual:** avanzar con **GO de Fase 0**.
- **Condición para siguiente inversión:** iniciar Fase 1 (persistencia + tests
  críticos) antes de exponer a tráfico real.
- **Riesgo aceptado explícitamente en MVP:** estado en memoria volátil.
