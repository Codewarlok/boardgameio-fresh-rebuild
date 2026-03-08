const mockRoomStatus = {
  roomCode: "NANA42",
  game: "Tic-Tac-Toe",
  host: "Player 1",
  players: 1,
  maxPlayers: 2,
  state: "Esperando rival",
};

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
          Lobby MVP
        </h1>
        <p class="text-slate-600">
          Crea una partida, únete con código y valida el estado de sala antes de
          arrancar la selección de juego.
        </p>
      </header>

      <section class="grid gap-4 md:grid-cols-2">
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">Crear partida</h2>
          <p class="mt-1 text-sm text-slate-600">
            Define un juego y genera código de sala.
          </p>

          <form class="mt-4 space-y-3">
            <label class="block space-y-1">
              <span class="text-sm font-medium text-slate-700">Juego</span>
              <select class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-500 focus:outline-none">
                <option>Tic-Tac-Toe</option>
                <option>Connect Four (próximo)</option>
              </select>
            </label>

            <label class="block space-y-1">
              <span class="text-sm font-medium text-slate-700">
                Nombre del host
              </span>
              <input
                type="text"
                placeholder="Player 1"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </label>

            <button
              type="button"
              class="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Crear sala
            </button>
          </form>
        </article>

        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">
            Unirse con código
          </h2>
          <p class="mt-1 text-sm text-slate-600">
            Ingresa el código compartido por el host.
          </p>

          <form class="mt-4 space-y-3">
            <label class="block space-y-1">
              <span class="text-sm font-medium text-slate-700">
                Código de sala
              </span>
              <input
                type="text"
                placeholder="NANA42"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase tracking-widest focus:border-slate-500 focus:outline-none"
              />
            </label>

            <label class="block space-y-1">
              <span class="text-sm font-medium text-slate-700">Tu nombre</span>
              <input
                type="text"
                placeholder="Player 2"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </label>

            <button
              type="button"
              class="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Entrar a sala
            </button>
          </form>
        </article>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h2 class="text-lg font-semibold text-slate-900">
          Estado de sala (mock)
        </h2>
        <dl class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">
              Código
            </dt>
            <dd class="mt-1 text-base font-semibold text-slate-900">
              {mockRoomStatus.roomCode}
            </dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">
              Juego
            </dt>
            <dd class="mt-1 text-base font-semibold text-slate-900">
              {mockRoomStatus.game}
            </dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">
              Host
            </dt>
            <dd class="mt-1 text-base font-semibold text-slate-900">
              {mockRoomStatus.host}
            </dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">
              Jugadores
            </dt>
            <dd class="mt-1 text-base font-semibold text-slate-900">
              {mockRoomStatus.players}/{mockRoomStatus.maxPlayers}
            </dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3 sm:col-span-2 lg:col-span-2">
            <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">
              Estado
            </dt>
            <dd class="mt-1 text-base font-semibold text-amber-700">
              {mockRoomStatus.state}
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
