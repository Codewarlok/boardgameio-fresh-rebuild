import PrincesaRoomView from "@/islands/PrincesaRoomView.tsx";

interface Props {
  params: {
    roomId: string;
  };
  url: URL;
}

export default function SalaPage({ params, url }: Props) {
  const roomId = params.roomId.toUpperCase();
  const playerId = url.searchParams.get("playerId") ?? "";

  return (
    <main class="mx-auto max-w-5xl p-6 space-y-6">
      <header class="space-y-2">
        <a
          href="/lobby"
          class="text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          ← Volver al lobby
        </a>
        <h1 class="text-3xl font-bold tracking-tight text-slate-900">
          Sala · Juego Princesa
        </h1>
        <p class="text-slate-600">
          Vista dedicada de sala para continuar la partida fuera del lobby.
        </p>
      </header>

      <PrincesaRoomView roomId={roomId} playerId={playerId} />
    </main>
  );
}
