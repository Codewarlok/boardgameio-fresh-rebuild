import { useMemo, useState } from "preact/hooks";
import type { LobbyRoom } from "@/utils/lobby.ts";

type ApiError = { error?: string };
type CreateRoomResponse = { room: LobbyRoom; playerId: string };
type JoinRoomResponse = { room: LobbyRoom; playerId: string };
type ApiRoomResponse = { room: LobbyRoom };

export default function PrincesaLobby() {
  const [hostName, setHostName] = useState("Jugador 1");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [joinName, setJoinName] = useState("Jugador 2");

  const [room, setRoom] = useState<LobbyRoom | null>(null);
  const [roomId, setRoomId] = useState("");
  const [playerId, setPlayerId] = useState("");

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const me = useMemo(
    () => room?.players.find((player) => player.id === playerId) ?? null,
    [room, playerId],
  );
  const isHost = !!me?.isHost;
  const allReady = !!room && room.players.length > 0 &&
    room.players.every((p) => p.isReady);
  const canStart = !!room && isHost && room.status === "waiting" && allReady &&
    room.players.length >= 2;

  const withAction = async (action: string, fn: () => Promise<void>) => {
    setLoadingAction(action);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoadingAction(null);
    }
  };

  const createRoom = async () => {
    await withAction("create", async () => {
      const data = await fetchJson<CreateRoomResponse>("/api/lobby/rooms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hostName }),
      });
      setRoom(data.room);
      setRoomId(data.room.id);
      setPlayerId(data.playerId);
      setJoinRoomId(data.room.id);
      setNotice(`Sala ${data.room.id} creada. Ya puedes compartir el código.`);
    });
  };

  const joinRoom = async () => {
    await withAction("join", async () => {
      const normalizedRoomId = joinRoomId.trim().toUpperCase();
      if (!normalizedRoomId) {
        throw new Error("Debes ingresar el código de sala");
      }

      const data = await fetchJson<JoinRoomResponse>(
        `/api/lobby/rooms/${normalizedRoomId}/join`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: joinName }),
        },
      );

      setRoom(data.room);
      setRoomId(data.room.id);
      setPlayerId(data.playerId);
      setNotice(
        `Te uniste a la sala ${data.room.id} como ${
          joinName.trim() || "Jugador"
        }.`,
      );
    });
  };

  const refreshRoom = async () => {
    await withAction("refresh", async () => {
      if (!roomId) throw new Error("No hay sala seleccionada");
      const data = await fetchJson<ApiRoomResponse>(
        `/api/lobby/rooms/${roomId}`,
      );
      setRoom(data.room);
      setNotice("Estado de sala actualizado.");
    });
  };

  const toggleReady = async () => {
    await withAction("ready", async () => {
      if (!roomId || !playerId || !me) {
        throw new Error("Debes crear o unirte a una sala");
      }

      const data = await fetchJson<ApiRoomResponse>(
        `/api/lobby/rooms/${roomId}/ready`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ playerId, ready: !me.isReady }),
        },
      );
      setRoom(data.room);
      setNotice(!me.isReady ? "Marcado como listo." : "Ya no estás listo.");
    });
  };

  const startGame = async () => {
    await withAction("start", async () => {
      if (!roomId || !playerId) {
        throw new Error("Debes crear o unirte a una sala");
      }

      const data = await fetchJson<ApiRoomResponse>(
        `/api/lobby/rooms/${roomId}/start`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ playerId }),
        },
      );
      setRoom(data.room);
      setNotice("Partida iniciada. Redirigiendo a la vista de sala...");
      globalThis.location.href = `/sala/${data.room.id}?playerId=${
        encodeURIComponent(playerId)
      }`;
    });
  };

  return (
    <section class="space-y-6">
      <div class="grid gap-4 md:grid-cols-2">
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">Crear sala</h2>
          <p class="mt-1 text-sm text-slate-600">
            Crea sala y entra automáticamente como host.
          </p>

          <label class="mt-4 block space-y-1">
            <span class="text-sm font-medium text-slate-700">Tu nombre</span>
            <input
              type="text"
              value={hostName}
              onInput={(e) => setHostName((e.target as HTMLInputElement).value)}
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <button
            type="button"
            class="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            onClick={createRoom}
            disabled={loadingAction !== null}
          >
            {loadingAction === "create" ? "Creando..." : "Abrir sala"}
          </button>
        </article>

        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">Unirse a sala</h2>
          <p class="mt-1 text-sm text-slate-600">
            Ingresa código y nombre para sumarte como jugador.
          </p>

          <label class="mt-4 block space-y-1">
            <span class="text-sm font-medium text-slate-700">
              Código de sala
            </span>
            <input
              type="text"
              value={joinRoomId}
              onInput={(e) =>
                setJoinRoomId(
                  (e.target as HTMLInputElement).value.toUpperCase(),
                )}
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase"
              placeholder="AB12CD34"
            />
          </label>

          <label class="mt-3 block space-y-1">
            <span class="text-sm font-medium text-slate-700">Tu nombre</span>
            <input
              type="text"
              value={joinName}
              onInput={(e) => setJoinName((e.target as HTMLInputElement).value)}
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <button
            type="button"
            class="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            onClick={joinRoom}
            disabled={loadingAction !== null}
          >
            {loadingAction === "join" ? "Uniéndose..." : "Unirme"}
          </button>
        </article>
      </div>

      {error && <p class="text-sm font-medium text-red-600">{error}</p>}
      {notice && <p class="text-sm font-medium text-emerald-700">{notice}</p>}

      {room && (
        <article class="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="text-lg font-semibold text-slate-900">
                Estado de sala
              </h3>
              <p class="text-sm text-slate-700">
                Código: <b>{room.id}</b> · Estado: <b>{room.status}</b>
              </p>
              <p class="text-sm text-slate-700">
                Jugadores: <b>{room.players.length}</b> · Todos listos:{" "}
                <b>{allReady ? "sí" : "no"}</b>
              </p>
            </div>
            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={refreshRoom}
              disabled={loadingAction !== null}
            >
              {loadingAction === "refresh" ? "Actualizando..." : "Actualizar"}
            </button>
          </div>

          <div class="grid gap-3 md:grid-cols-2">
            {room.players.map((p) => (
              <div
                key={p.id}
                class="rounded-lg border border-slate-200 bg-white p-3"
              >
                <p class="font-semibold text-slate-900">
                  {p.name} {p.isHost ? "(host)" : ""}
                </p>
                <p class="text-sm text-slate-600">
                  Ready: {p.isReady ? "sí" : "no"}
                </p>
                <p class="text-sm text-slate-600">
                  Mano: {p.hand.length > 0 ? p.hand.join(", ") : "sin repartir"}
                </p>
              </div>
            ))}
          </div>

          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              onClick={toggleReady}
              disabled={loadingAction !== null || !me ||
                room.status !== "waiting"}
            >
              {loadingAction === "ready"
                ? "Guardando..."
                : me?.isReady
                ? "Quitar ready"
                : "Marcar ready"}
            </button>

            <button
              type="button"
              class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              onClick={startGame}
              disabled={loadingAction !== null || !canStart}
            >
              {loadingAction === "start" ? "Iniciando..." : "Iniciar partida"}
            </button>
          </div>

          {!isHost && room.status === "waiting" && (
            <p class="text-xs text-slate-600">
              Solo el host puede iniciar cuando todos estén ready.
            </p>
          )}
        </article>
      )}
    </section>
  );
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    let message = "Error en la solicitud";
    try {
      const data = (await res.json()) as ApiError;
      if (data.error) message = data.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}
