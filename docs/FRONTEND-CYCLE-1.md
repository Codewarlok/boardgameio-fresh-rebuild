# FRONTEND-CYCLE-1

## Objetivo

Avanzar UI del MVP para lobby y selección de juego inicial.

## Cambios implementados

### 1) Nueva ruta `/lobby`

Se creó `routes/lobby.tsx` con layout base en Tailwind, incluyendo:

- Bloque **Crear partida** (selector de juego + nombre host + botón).
- Bloque **Unirse con código** (código de sala + nombre jugador + botón).
- Bloque **Estado de sala (mock)** con datos simulados:
  - código,
  - juego,
  - host,
  - jugadores,
  - estado.

### 2) Home mejorado con CTA hacia lobby

Se actualizó `routes/index.tsx` para:

- reforzar copy del MVP,
- agregar CTA principal **"Ir al lobby"** (`/lobby`),
- mantener acceso a demo técnica existente (Tic-Tac-Toe).

### 3) Consistencia visual Tailwind

Se aplicó estilo coherente en ambas vistas:

- cards con bordes suaves y `shadow-sm`,
- jerarquía tipográfica consistente,
- botones primary/secondary homogéneos,
- paleta `slate`/`emerald` para tono MVP.

## Validaciones ejecutadas

- `deno task check` ✅
- `deno task build` ✅

## Notas

- Durante la ejecución inicial, `build` en paralelo con otros comandos falló por
  artefacto temporal de Vite/Fresh.
- Re-ejecutado de forma secuencial: build completado correctamente.
