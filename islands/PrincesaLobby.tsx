import { useState } from "preact/hooks";
import type { LobbyRoom } from "@/utils/lobby.ts";

type ApiRoomResponse = { room: LobbyRoom };

export default function PrincesaLobby() {
  const [hostName, setHostName] = useState("Jugador 1");
  const [playerCount, setPlayerCount] = useState(2);
  const [room, setRoom] = useState<LobbyRoom | null>(null);
  const [error, setError] = useState("");

  const createRoom = async () => {
    setError("");
    const res = await fetch("/api/lobby/rooms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hostName }),
    });
    if (!res.ok) {
      setError("No se pudo crear la sala");
      return;
    }
    const data = (await res.json()) as ApiRoomResponse;
    setRoom(data.room);
  };

  const startGame = async () => {
    if (!room) {
      setError("Primero crea una sala");
      return;
    }
    setError("");
    const res = await fetch(`/api/lobby/rooms/${room.id}/start`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ playerCount }),
    });
    if (!res.ok) {
      setError("No se pudo iniciar el juego Princesa");
      return;
    }
    const data = (await res.json()) as ApiRoomResponse;
    setRoom(data.room);
  };

  return (
    <section class="space-y-6">
      <div class="grid gap-4 md:grid-cols-2">
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">
            Crear sala de Princesa
          </h2>
          <p class="mt-1 text-sm text-slate-600">
            Se genera un ID de sala para invitar jugadores.
          </p>

          <label class="mt-4 block space-y-1">
            <span class="text-sm font-medium text-slate-700">Nombre host</span>
            <input
              type="text"
              value={hostName}
              onInput={(e) => setHostName((e.target as HTMLInputElement).value)}
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <button
            type="button"
            class="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            onClick={createRoom}
          >
            Abrir sala
          </button>

          {room && (
            <p class="mt-3 text-sm text-emerald-700">
              Sala creada: <b>{room.id}</b>
            </p>
          )}
        </article>

        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">Iniciar partida</h2>
          <p class="mt-1 text-sm text-slate-600">
            Confirma número de jugadores y reparte baraja 1–21.
          </p>

          <label class="mt-4 block space-y-1">
            <span class="text-sm font-medium text-slate-700">
              Número de jugadores
            </span>
            <input
              type="number"
              min={2}
              max={8}
              value={playerCount}
              onInput={(e) =>
                setPlayerCount(Number((e.target as HTMLInputElement).value))}
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <button
            type="button"
            class="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
            onClick={startGame}
          >
            Confirmar jugadores y repartir
          </button>
        </article>
      </div>

      {error && <p class="text-sm font-medium text-red-600">{error}</p>}

      {room && (
        <article class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 class="text-lg font-semibold text-slate-900">Estado de sala</h3>
          <p class="text-sm text-slate-700">
            Juego: <b>Princesa</b> · Estado: <b>{room.status}</b>
          </p>
          <p class="text-sm text-slate-700">
            Jugadores: <b>{room.players.length}</b> · Cartas restantes:
            <b>{room.deckRemaining.length}</b>
          </p>

          <div class="mt-4 grid gap-3 md:grid-cols-2">
            {room.players.map((p) => (
              <div
                key={p.id}
                class="rounded-lg border border-slate-200 bg-white p-3"
              >
                <p class="font-semibold text-slate-900">
                  {p.name} {p.isHost ? "(host)" : ""}
                </p>
                <p class="text-sm text-slate-600">
                  Mano: {p.hand.length > 0 ? p.hand.join(", ") : "sin repartir"}
                </p>
              </div>
            ))}
          </div>
        </article>
      )}
    </section>
  );
}
