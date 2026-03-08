# QA Cycle 1 — MVP (funcional + smoke)

Fecha: 2026-03-07/08 (America/Santiago) Proyecto:
`/home/dio/.openclaw/workspace/projects/boardgame-fresh-rebuild`

## 1) Matriz de pruebas MVP propuesta

| ID     | Tipo          | Flujo                    | Caso                                           | Esperado                             | Prioridad |
| ------ | ------------- | ------------------------ | ---------------------------------------------- | ------------------------------------ | --------- |
| SMK-01 | Smoke         | Disponibilidad           | `GET /` responde                               | HTTP 200                             | Alta      |
| SMK-02 | Smoke         | Disponibilidad           | `GET /api/dio` responde                        | HTTP 200 + `Hello, <Name>!`          | Alta      |
| SMK-03 | Smoke         | Build/arranque           | `deno task build` + `deno task start`          | Build OK + servidor escuchando       | Alta      |
| SMK-04 | Smoke         | Assets                   | `GET /favicon.ico`                             | HTTP 200                             | Media     |
| FUN-01 | Funcional     | Home                     | Render de hero + bloque demo Tic-Tac-Toe       | Textos y botones visibles            | Alta      |
| FUN-02 | Funcional     | Lobby UI                 | `GET /lobby` renderiza formulario crear/unirse | HTTP 200 + `Lobby MVP`               | Alta      |
| FUN-03 | Funcional API | Crear sala               | `POST /api/lobby/rooms` con JSON válido        | HTTP 201 + room ID + host persistido | Alta      |
| FUN-04 | Funcional API | Leer sala                | `GET /api/lobby/rooms/{id}` existente          | HTTP 200 + mismo `id`                | Alta      |
| FUN-05 | Funcional API | Error controlado         | `GET /api/lobby/rooms/{id}` inexistente        | HTTP 404                             | Alta      |
| FUN-06 | Funcional API | Fallback payload         | `POST /api/lobby/rooms` sin JSON               | HTTP 201 + host default `Host`       | Media     |
| FUN-07 | Funcional UI  | Tic-Tac-Toe turnos       | Solo jugador activo puede jugar                | Estado consistente por turno         | Media     |
| FUN-08 | Funcional UI  | Tic-Tac-Toe fin de juego | Ganador y empate se muestran                   | Mensaje correcto                     | Media     |
| FUN-09 | Funcional UI  | Reinicio partida         | Botón `Reiniciar` limpia tablero               | Estado inicial                       | Media     |

---

## 2) Checklist de release (Cycle 1)

### Gate de calidad

- [ ] `deno task check` en verde (fmt/lint/check)
- [x] `deno task build` en verde
- [x] `deno task start` levanta server en `:8000`

### Smoke release

- [x] Home (`/`) responde 200
- [x] API saludo (`/api/dio`) responde 200
- [x] Assets básicos (`/favicon.ico`) responden 200
- [ ] Lobby (`/lobby`) responde 200

### API lobby

- [x] Crear sala (201)
- [x] Consultar sala existente (200)
- [x] Consultar sala inexistente (404)
- [x] Fallback sin JSON (201 + defaults)

### UI/Juego (manual)

- [ ] Flujo visual lobby crear/unirse validado en navegador
- [ ] Tic-Tac-Toe: turnos, ganador, empate, reinicio

### Evidencia/documentación

- [x] Hallazgos documentados en este archivo
- [x] Riesgos y bloqueos identificados

---

## 3) Ejecución manual básica y hallazgos

## 3.1 Ejecución realizada

- `deno task build` ✅
- `deno task start` ✅ (escucha en `http://0.0.0.0:8000/`)
- Pruebas HTTP manuales (fetch/curl) sobre rutas web y APIs.

## 3.2 Resultados

| Caso ejecutado                                         | Resultado                            |
| ------------------------------------------------------ | ------------------------------------ |
| `GET /`                                                | ✅ 200                               |
| `GET /api/dio`                                         | ✅ 200, body `Hello, Dio!`           |
| `GET /favicon.ico`                                     | ✅ 200                               |
| `POST /api/lobby/rooms` JSON `{hostName:"Nyx"}`        | ✅ 201, crea room + host `Nyx`       |
| `GET /api/lobby/rooms/{id}` (id en lower-case)         | ✅ 200 (case-insensitive confirmado) |
| `GET /api/lobby/rooms/NOEXIST1`                        | ✅ 404                               |
| `POST /api/lobby/rooms` con `content-type: text/plain` | ✅ 201 + host default `Host`         |
| `GET /lobby`                                           | ❌ 404 (esperado 200)                |

Resumen ejecución: **7/9 OK**.

## 3.3 Hallazgos

### H-01 (Alta) — `/lobby` responde 404

- **Severidad:** Alta
- **Impacto:** flujo MVP de lobby no usable desde UI.
- **Observación:** existe `routes/lobby.tsx`, pero en runtime productivo
  (`deno task start`) `/lobby` devuelve 404.
- **Estado:** Abierto.
- **Siguiente paso sugerido:** investigar registro efectivo de rutas en arranque
  (`app.fsRoutes()` / generación de artefactos `_fresh`) y agregar test de
  integración para ruta `/lobby`.

### H-02 (Media) — Gate `check` no pasa por formato

- **Severidad:** Media
- **Impacto:** bloquea release si policy exige gate estricto.
- **Observación:** `deno task check` falla por archivos docs no formateados.
- **Estado:** Abierto.
- **Siguiente paso sugerido:** ejecutar `deno fmt` en docs y revalidar
  `deno task check`.

### H-03 (Baja) — Validación UI interactiva incompleta en esta corrida

- **Severidad:** Baja
- **Impacto:** no se validó visualmente turno/ganador/empate/reinicio en
  navegador automatizado.
- **Observación:** servicio de control de browser OpenClaw no disponible en esta
  sesión.
- **Estado:** Pendiente de re-test.
- **Siguiente paso sugerido:** re-ejecutar smoke UI cuando browser control esté
  operativo.

---

## 4) Recomendación de salida de ciclo

**No liberar aún** hasta cerrar H-01 (`/lobby` 404) y dejar `deno task check` en
verde.
