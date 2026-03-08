import BoardGameDemo from "../islands/BoardGameDemo.tsx";

export default function Home() {
  return (
    <main class="mx-auto max-w-3xl p-6 space-y-6">
      <h1 class="text-3xl font-bold">boardgame.io → FreshJS Rebuild (MVP)</h1>
      <p class="text-gray-700">
        Workspace inicial del proyecto de rebuild. Esta demo monta una base de
        juego con <code>boardgame.io</code>{" "}
        corriendo dentro de Fresh para validar arquitectura, DX y ciclo de
        integración.
      </p>

      <section class="rounded-xl border p-4">
        <h2 class="mb-3 text-xl font-semibold">Demo rápida: Tic-Tac-Toe</h2>
        <BoardGameDemo />
      </section>
    </main>
  );
}
