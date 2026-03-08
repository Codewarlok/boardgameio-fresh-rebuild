import ThemeToggle from "@/islands/ThemeToggle.tsx";
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
      <header class="flex items-start justify-between gap-4">
        <div class="space-y-2">
          <a href="/lobby" class="link link-hover text-sm">
            ← Volver al lobby
          </a>
          <h1 class="text-3xl font-bold tracking-tight">
            Sala · Juego Princesa
          </h1>
          <p class="text-base-content/70">
            Vista de espera dinámica para coordinar jugadores y arrancar
            partida.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <PrincesaRoomView roomId={roomId} playerId={playerId} />
    </main>
  );
}
