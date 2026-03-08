import ThemeToggle from "@/islands/ThemeToggle.tsx";
import PrincesaLobby from "@/islands/PrincesaLobby.tsx";

export default function LobbyPage() {
  return (
    <main class="mx-auto max-w-5xl p-6 space-y-6">
      <header class="flex items-start justify-between gap-4">
        <div class="space-y-2">
          <a href="/" class="link link-hover text-sm">
            ← Volver al home
          </a>
          <h1 class="text-3xl font-bold tracking-tight">
            Lobby · Juego Princesa
          </h1>
          <p class="text-base-content/70">
            Crea o únete a una sala y continúa en vista dinámica de espera.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <PrincesaLobby />
    </main>
  );
}
