# ADR 0001: Realtime nativo para estado de sala Princesa

- Estado: Aprobado
- Fecha: 2026-03-08
- Contexto: La vista de sala hacía polling cada 4s para sincronizar
  jugadores/ready/start, generando requests repetitivas y latencia visible de
  actualización.

## Decisión

Adoptar **WebSocket nativo** de Deno/Fresh para difusión de estado por sala, sin
librerías externas.

### Tecnologías evaluadas (nativas)

1. **WebSocket (`Deno.upgradeWebSocket`)**
   - ✅ Bidireccional, latencia baja, soporte nativo browser + Deno.
   - ✅ Encaja con eventos de sala (`join`, `ready`, `start`, `snapshot`).
2. **SSE (Server-Sent Events)**
   - ✅ Nativo y simple para unidireccional servidor→cliente.
   - ⚠️ Menos flexible para evolución futura (acks/comandos) y reconexión manual
     más limitada.
3. **Long polling**
   - ✅ Compatible universal.
   - ❌ Sigue siendo modelo de polling y no cumple objetivo de reducir requests
     repetitivas.

**Elección:** WebSocket nativo + fallback controlado a polling lento solo ante
falla de WS.

## Diseño

- Canal por sala: `GET /api/lobby/rooms/:roomId/ws`
- Eventos emitidos por backend:
  - `room_snapshot` (estado inicial al conectar)
  - `room_created`
  - `player_joined`
  - `player_ready_changed`
  - `game_started`
- Al modificar estado en dominio (`utils/lobby.ts`), se publica evento a
  suscriptores de esa sala.
- Frontend en sala:
  - Conexión WS con reconexión progresiva.
  - Actualización de UI por evento recibido.
  - Polling fallback cada 8s solo si WS no está conectado.

## Consecuencias

- Reducción fuerte del tráfico periódico en salas activas con WS estable.
- Mejor UX (sin esperar ventana de polling para ver cambios).
- Riesgo operativo: estado en memoria (instancia única). Si se escala
  horizontalmente, se requerirá backplane (Redis/pubsub).

## Riesgos y mitigaciones

- **WS cortado por red/proxy:** fallback a polling controlado + reconexión
  automática.
- **Escalado multi-instancia:** documentar necesidad de bus distribuido para
  eventos.
- **Estado efímero en memoria:** aceptable para fase actual de mock lobby.
