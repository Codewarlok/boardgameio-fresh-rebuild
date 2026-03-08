import { useState } from "preact/hooks";
import type { LobbyRoom } from "@/utils/lobby.ts";

type ApiError = { error?: string; message?: string };
type CreateRoomResponse = { room: LobbyRoom; playerId: string };
type JoinRoomResponse = { room: LobbyRoom; playerId: string };

export default function PrincesaLobby() {
  const [hostName, setHostName] = useState("Jugador 1");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [joinName, setJoinName] = useState("Jugador 2");

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState("");

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

  const createRoom = async () => {
    await withAction("create", async () => {
      const data = await fetchJson<CreateRoomResponse>("/api/lobby/rooms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hostName }),
      });

      globalThis.location.href = `/sala/${data.room.id}?playerId=${
        encodeURIComponent(data.playerId)
      }`;
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

      globalThis.location.href = `/sala/${data.room.id}?playerId=${
        encodeURIComponent(data.playerId)
      }`;
    });
  };

  return (
    <section class="space-y-6">
      <div class="grid gap-4 md:grid-cols-2">
        <article class="card bg-base-100 border border-base-300 shadow-sm">
          <div class="card-body">
            <h2 class="card-title">Crear sala</h2>
            <p class="text-sm text-base-content/70">
              Crea sala y redirige a la sala de espera con ID compartible.
            </p>

            <label class="form-control mt-2">
              <span class="label-text text-sm">Tu nombre</span>
              <input
                type="text"
                value={hostName}
                onInput={(e) =>
                  setHostName((e.target as HTMLInputElement).value)}
                class="input input-bordered w-full"
              />
            </label>

            <button
              type="button"
              class="btn btn-primary mt-3"
              onClick={createRoom}
              disabled={loadingAction !== null}
            >
              {loadingAction === "create" ? "Creando..." : "Abrir sala"}
            </button>
          </div>
        </article>

        <article class="card bg-base-100 border border-base-300 shadow-sm">
          <div class="card-body">
            <h2 class="card-title">Unirse a sala</h2>
            <p class="text-sm text-base-content/70">
              Ingresa código y nombre para ir directo a la sala de espera.
            </p>

            <label class="form-control mt-2">
              <span class="label-text text-sm">Código de sala</span>
              <input
                type="text"
                value={joinRoomId}
                onInput={(e) =>
                  setJoinRoomId(
                    (e.target as HTMLInputElement).value.toUpperCase(),
                  )}
                class="input input-bordered w-full uppercase"
                placeholder="AB12CD34"
              />
            </label>

            <label class="form-control mt-2">
              <span class="label-text text-sm">Tu nombre</span>
              <input
                type="text"
                value={joinName}
                onInput={(e) =>
                  setJoinName((e.target as HTMLInputElement).value)}
                class="input input-bordered w-full"
              />
            </label>

            <button
              type="button"
              class="btn btn-secondary mt-3"
              onClick={joinRoom}
              disabled={loadingAction !== null}
            >
              {loadingAction === "join" ? "Uniéndose..." : "Unirme"}
            </button>
          </div>
        </article>
      </div>

      {error && (
        <div class="alert alert-error">
          <span>{error}</span>
        </div>
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
