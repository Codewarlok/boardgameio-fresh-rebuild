# PRINCESA — Cells Execution Plan (Backend / Frontend / QA)

- Fecha: 2026-03-07 23:20:40 -03
- Proyecto: `/home/dio/.openclaw/workspace/projects/boardgame-fresh-rebuild`
- Responsable de supervisión: DevOps lead (implementación Princesa)
- Horizonte operativo: 48 horas (hitos en 24h + 48h)

## 1) Objetivo de ejecución por células

Operar en ciclos cortos con dependencias explícitas para consolidar el MVP de
Princesa y preparar merge/release sin regressions en lobby + inicio de partida.

## 2) Asignaciones por célula

## Backend Cell

**Scope:** contratos API, consistencia de estado de sala/partida, estabilidad de
endpoints.

**Entregables 24h**

- Congelar contrato de payload/errores para:
  - `POST /api/lobby/rooms`
  - `GET /api/lobby/rooms/:roomId`
  - `POST /api/lobby/rooms/:roomId/start`
- Añadir pruebas mínimas o scripts reproducibles por endpoint (happy path +
  error básico).
- Garantizar normalización de `roomId` consistente en todos los handlers.

**Entregables 48h**

- Endpoint siguiente de gameplay (si entra en scope aprobado).
- Fixtures determinísticos (seed) para reproducir rondas en QA.
- Tabla de errores estándar para consumo frontend.

## Frontend Cell

**Scope:** experiencia en `/lobby`, robustez de llamadas API, representación de
estado de partida.

**Entregables 24h**

- Endurecer estados de UI: loading, empty, error con mensajes accionables.
- Validación de inputs de sala y manejo de roomId en distintas capitalizaciones.
- Ajustes visuales básicos para evitar bloqueos de flujo principal.

**Entregables 48h**

- Integrar estado post-`start` con feedback claro al jugador.
- Reducir acoplamiento con payloads ambiguos (tipos explícitos compartidos).
- Checklist de UX smoke para handoff a QA.

## QA Cell

**Scope:** smoke automatizado + regresión corta orientada a flujo core.

**Entregables 24h**

- Smoke script mínimo (CLI o runner actual) con validaciones:
  - `/` responde 200
  - `/lobby` responde 200
  - create room responde 201
  - start room responde 200
- Reporte corto de resultados con timestamp.

**Entregables 48h**

- Regresión corta por matriz base (navegador/entorno definido).
- Casos negativos mínimos: room inválida, room inexistente, start repetido.
- Criterio de severidad P0/P1/P2 documentado para gate release.

## DevOps Supervision

**Scope:** orchestration, gates, evidencia, decisiones go/no-go.

**Entregables 24h**

- Supervisar cumplimiento 24h de cada célula.
- Verificar CI y mantener semáforo único en `DEVOPS-SUPERVISION-REPORT.md`.
- Registrar bloqueos y dueños.

**Entregables 48h**

- Ejecutar pre-release check completo.
- Consolidar evidencia técnica (CI + smoke + docs).
- Emitir recomendación formal de release (GO/NO-GO).

## 3) Dependencias cruzadas

1. **Backend -> Frontend**
   - Frontend depende de payloads/errores estables para evitar parches ad hoc.
2. **Backend -> QA**
   - QA depende de fixtures y semántica de errores para pruebas repetibles.
3. **Frontend -> QA**
   - QA depende de estados de UI claros para validar flujos
     manuales/automáticos.
4. **Todas -> DevOps**
   - DevOps requiere evidencia por célula para aprobar merge/release.

## 4) Ritual operativo por ciclo

- **Checkpoint T+24h:** revisión de hitos por célula + desbloqueos.
- **Checkpoint T+48h:** cierre de hitos, evaluación de riesgo, decisión de
  merge/release.
- **Formato de reporte por célula:**
  - Hecho
  - Pendiente
  - Bloqueos
  - Riesgo (P0/P1/P2)
  - Evidencia (comando/screenshot/log)

## 5) Gates de calidad y criterios

## Merge gate (PR)

- `deno task check` PASS
- `deno task build` PASS
- Evidencia mínima de prueba por célula adjunta en PR
- Sin issues P0/P1 abiertos para el scope del PR

## Release gate

- Todos los merge gates en verde
- Smoke runtime completo PASS
- Compatibilidad API/UI validada en flujo principal de lobby
- Decisión de DevOps documentada en reporte de supervisión

## 6) Estado de arranque (baseline)

Baseline validada al iniciar este plan:

- `deno task check`: PASS
- `deno task build`: PASS
- CI presente en `.github/workflows/ci.yml`
- Flujo MVP de lobby/start operativo

Con esto, la ejecución por células queda formalmente iniciada para ciclo de 48h.
