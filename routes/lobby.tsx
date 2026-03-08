import PrincesaLobby from "@/islands/PrincesaLobby.tsx";

export default function LobbyPage() {
  return (
    <main class="mx-auto max-w-5xl p-6 space-y-6">
      <header class="space-y-2">
        <a
          href="/"
          class="text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          ← Volver al home
        </a>
        <h1 class="text-3xl font-bold tracking-tight text-slate-900">
          Lobby · Juego Princesa
        </h1>
        <p class="text-slate-600">
          Flujo MVP: crear o unirse a sala, gestionar estado ready por jugador y
          permitir que el host inicie la partida cuando todos estén listos.
        </p>
      </header>

      <PrincesaLobby />
    </main>
  );
}
