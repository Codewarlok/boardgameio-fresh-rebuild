import { useEffect, useMemo, useState } from "preact/hooks";
import type { LobbyRoom } from "@/utils/lobby.ts";

type ApiError = { error?: string; message?: string };
type ApiRoomResponse = { room: LobbyRoom };

interface Props {
  roomId: string;
  playerId?: string;
}

export default function PrincesaRoomView({ roomId, playerId = "" }: Props) {
  const [room, setRoom] = useState<LobbyRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const me = useMemo(
    () => room?.players.find((player) => player.id === playerId) ?? null,
    [room, playerId],
  );

  const loadRoom = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");
    try {
      const data = await fetchJson<ApiRoomResponse>(
        `/api/lobby/rooms/${roomId.toUpperCase()}`,
      );
      setRoom(data.room);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cargar la sala",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRoom();
  }, [roomId]);

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId.toUpperCase());
      setNotice("ID copiado al portapapeles.");
      setTimeout(() => setNotice(""), 1600);
    } catch {
      setError("No se pudo copiar. Copia manualmente el ID.");
    }
  };

  if (loading) {
    return <p class="text-sm text-slate-600">Cargando sala…</p>;
  }

  return (
    <section class="space-y-6">
      <article class="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-5">
        <p class="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Sala activa
        </p>
        <div class="mt-2 flex flex-wrap items-center gap-3">
          <p class="text-3xl font-black tracking-wider text-emerald-900">
            {roomId.toUpperCase()}
          </p>
          <button
            type="button"
            class="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white"
            onClick={copyRoomId}
          >
            Copiar ID
          </button>
        </div>
        <p class="mt-2 text-sm text-emerald-800">
          Compártelo con el segundo jugador para que entre desde el lobby.
        </p>
      </article>

      {error && <p class="text-sm font-medium text-red-600">{error}</p>}
      {notice && <p class="text-sm font-medium text-emerald-700">{notice}</p>}

      {room && (
        <article class="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">
                Estado de partida
              </h2>
              <p class="text-sm text-slate-700">
                Estado: <b>{room.status}</b> · Jugadores:{" "}
                <b>{room.players.length}</b>
              </p>
              <p class="text-sm text-slate-700">
                Cartas restantes en mazo: <b>{room.deckRemaining.length}</b>
              </p>
            </div>
            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => loadRoom(true)}
              disabled={refreshing}
            >
              {refreshing ? "Actualizando..." : "Actualizar"}
            </button>
          </div>

          <div class="grid gap-3 md:grid-cols-2">
            {room.players.map((p) => (
              <div
                key={p.id}
                class="rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <p class="font-semibold text-slate-900">
                  {p.name} {p.isHost ? "(host)" : ""}
                  {me?.id === p.id ? " · tú" : ""}
                </p>
                <p class="text-sm text-slate-600">
                  Ready: {p.isReady ? "sí" : "no"}
                </p>
                <p class="text-sm text-slate-600">
                  Mano: {p.hand.length > 0 ? p.hand.join(", ") : "sin cartas"}
                </p>
              </div>
            ))}
          </div>
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
      if (data.message) message = data.message;
      else if (data.error) message = data.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}
