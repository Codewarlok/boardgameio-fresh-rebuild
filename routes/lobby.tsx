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
          Flujo MVP: crear sala, obtener ID para invitar jugadores, confirmar
          número de jugadores y repartir automáticamente una baraja de 21 cartas
          (1 al 21) entre todos los participantes.
        </p>
      </header>

      <PrincesaLobby />
    </main>
  );
}
