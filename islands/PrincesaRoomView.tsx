import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import RoomStatusBadge from "@/components/RoomStatusBadge.tsx";
import type { LobbyRoom } from "@/utils/lobby.ts";

type ApiError = { error?: string; message?: string };
type ApiRoomResponse = { room: LobbyRoom };
type RoomSocketEvent = {
  type: "ROOM_SNAPSHOT" | "ROOM_UPDATED";
  room: LobbyRoom;
  emittedAt: string;
};

interface Props {
  roomId: string;
  playerId?: string;
}

export default function PrincesaRoomView({ roomId, playerId = "" }: Props) {
  const [room, setRoom] = useState<LobbyRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [channel, setChannel] = useState<"websocket" | "polling">("polling");

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const me = useMemo(
    () => room?.players.find((player) => player.id === playerId) ?? null,
    [room, playerId],
  );

  const isHost = !!me?.isHost;
  const allReady = !!room && room.players.length > 0 &&
    room.players.every((p) => p.isReady);
  const canStart = !!room && isHost && room.status === "waiting" && allReady &&
    room.players.length >= 2;

  const clearTimers = () => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (pollTimerRef.current !== null) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const startFallbackPolling = () => {
    if (pollTimerRef.current !== null) return;
    setChannel("polling");

    pollTimerRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadRoom(true);
      }
    }, 10000);
  };

  const stopFallbackPolling = () => {
    if (pollTimerRef.current !== null) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const loadRoom = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const data = await fetchJson<ApiRoomResponse>(
        `/api/lobby/rooms/${roomId.toUpperCase()}`,
      );
      setRoom(data.room);
      if (silent) setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cargar la sala",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const scheduleReconnect = () => {
    if (reconnectTimerRef.current !== null) return;

    reconnectAttemptsRef.current += 1;
    const delay = Math.min(
      1000 * 2 ** (reconnectAttemptsRef.current - 1),
      10000,
    );

    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      connectRoomSocket();
    }, delay);
  };

  const connectRoomSocket = () => {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl =
      `${protocol}//${location.host}/api/lobby/rooms/${roomId.toUpperCase()}/ws`;

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        reconnectAttemptsRef.current = 0;
        setChannel("websocket");
        stopFallbackPolling();
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as RoomSocketEvent;
          if (
            (payload.type === "ROOM_SNAPSHOT" ||
              payload.type === "ROOM_UPDATED") && payload.room
          ) {
            setRoom(payload.room);
            setLoading(false);
            setRefreshing(false);
            setError("");
          }
        } catch {
          // ignore invalid payloads
        }
      };

      socket.onerror = () => {
        socket.close();
      };

      socket.onclose = () => {
        wsRef.current = null;
        startFallbackPolling();
        scheduleReconnect();
      };
    } catch {
      startFallbackPolling();
      scheduleReconnect();
    }
  };

  useEffect(() => {
    loadRoom();
    connectRoomSocket();

    return () => {
      clearTimers();
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [roomId]);

  const withAction = async (action: string, fn: () => Promise<void>) => {
    setLoadingAction(action);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoadingAction(null);
    }
  };

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId.toUpperCase());
      setNotice("ID copiado al portapapeles.");
      setTimeout(() => setNotice(""), 1600);
    } catch {
      setError("No se pudo copiar. Copia manualmente el ID.");
    }
  };

  const toggleReady = async () => {
    await withAction("ready", async () => {
      if (!room || !me || !playerId) {
        throw new Error("Debes crear o unirte a una sala");
      }

      const data = await fetchJson<ApiRoomResponse>(
        `/api/lobby/rooms/${room.id}/ready`,
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
      if (!room || !playerId) {
        throw new Error("Debes crear o unirte a una sala");
      }

      const data = await fetchJson<ApiRoomResponse>(
        `/api/lobby/rooms/${room.id}/start`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ playerId }),
        },
      );

      setRoom(data.room);
      setNotice("Partida iniciada.");
    });
  };

  if (loading) {
    return <span class="loading loading-dots loading-lg" />;
  }

  return (
    <section class="space-y-6">
      <article class="card bg-base-100 border-2 border-primary/40 shadow-sm">
        <div class="card-body">
          <p class="text-xs font-semibold uppercase tracking-wide text-primary">
            Sala activa
          </p>
          <div class="mt-1 flex flex-wrap items-center gap-3">
            <p class="font-mono text-3xl font-black tracking-widest text-primary">
              {roomId.toUpperCase()}
            </p>
            <button
              type="button"
              class="btn btn-primary btn-sm"
              onClick={copyRoomId}
            >
              Copiar ID
            </button>
            {room && <RoomStatusBadge status={room.status} />}
            <span class="badge badge-outline">
              Canal:{" "}
              {channel === "websocket" ? "WebSocket" : "Polling fallback"}
            </span>
          </div>
          <p class="text-sm text-base-content/70">
            Compártelo para que otros jugadores entren desde el lobby.
          </p>
        </div>
      </article>

      {error && (
        <div class="alert alert-error">
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div class="alert alert-success">
          <span>{notice}</span>
        </div>
      )}

      {room && (
        <article class="card bg-base-100 border border-base-300 shadow-sm">
          <div class="card-body space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 class="card-title">Espera de jugadores</h2>
                <p class="text-sm text-base-content/70">
                  Jugadores: <b>{room.players.length}</b> · Todos listos:{" "}
                  <b>{allReady ? "sí" : "no"}</b>
                </p>
                {refreshing && (
                  <p class="text-xs text-base-content/60">
                    Actualizando estado…
                  </p>
                )}
              </div>
              <button
                type="button"
                class="btn btn-outline btn-sm"
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
                  class="rounded-xl border border-base-300 bg-base-200 p-3"
                >
                  <p class="font-semibold">
                    {p.name} {p.isHost ? "(host)" : ""}
                    {me?.id === p.id ? " · tú" : ""}
                  </p>
                  <p class="text-sm">Ready: {p.isReady ? "sí" : "no"}</p>
                </div>
              ))}
            </div>

            <div class="flex flex-wrap gap-3">
              <button
                type="button"
                class="btn btn-accent"
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
                class="btn btn-secondary"
                onClick={startGame}
                disabled={loadingAction !== null || !canStart}
              >
                {loadingAction === "start" ? "Iniciando..." : "Iniciar partida"}
              </button>
            </div>

            {!isHost && room.status === "waiting" && (
              <p class="text-xs text-base-content/60">
                Solo el host puede iniciar cuando todos estén ready.
              </p>
            )}
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
