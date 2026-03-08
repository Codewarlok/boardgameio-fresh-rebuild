import BoardGameDemo from "../islands/BoardGameDemo.tsx";

export default function Home() {
  return (
    <main class="mx-auto max-w-4xl p-6 space-y-8">
      <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p class="mb-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          MVP · Lobby Ready
        </p>
        <h1 class="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          boardgame.io → FreshJS Rebuild
        </h1>
        <p class="mt-3 max-w-2xl text-slate-600">
          Base funcional para juegos por turnos en Fresh. Ya puedes abrir una
          sala del juego Princesa, compartir el ID, confirmar jugadores y
          repartir automáticamente la baraja 1..21.
        </p>

        <div class="mt-5 flex flex-wrap gap-3">
          <a
            href="/lobby"
            class="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Ir al lobby
          </a>
          <a
            href="#demo"
            class="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Ver demo técnica
          </a>
        </div>
      </section>

      <section
        id="demo"
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 class="mb-3 text-xl font-semibold text-slate-900">
          Demo rápida: Tic-Tac-Toe
        </h2>
        <BoardGameDemo />
      </section>
    </main>
  );
}
