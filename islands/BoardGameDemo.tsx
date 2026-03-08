import { useEffect, useMemo, useState } from "preact/hooks";
import { Client } from "boardgame/client";

type G = { cells: (null | "0" | "1")[] };
type Ctx = {
  currentPlayer?: "0" | "1";
  gameover?: { winner?: "0" | "1"; draw?: boolean };
};
type BGState = { G?: G; ctx?: Ctx };

const TicTacToe = {
  setup: (): G => ({ cells: Array(9).fill(null) }),
  turn: { minMoves: 1, maxMoves: 1 },
  moves: {
    clickCell: ({ G, playerID }: { G: G; playerID: string }, id: number) => {
      if (G.cells[id] !== null) return;
      G.cells[id] = playerID as "0" | "1";
    },
  },
  endIf: ({ G }: { G: G }) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (const [a, b, c] of lines) {
      if (
        G.cells[a] && G.cells[a] === G.cells[b] && G.cells[a] === G.cells[c]
      ) {
        return { winner: G.cells[a] };
      }
    }
    if (G.cells.every((c) => c !== null)) return { draw: true };
    return undefined;
  },
};

export default function BoardGameDemo() {
  const [player, setPlayer] = useState<"0" | "1">("0");
  const [tick, setTick] = useState(0);

  const client = useMemo(() => Client({ game: TicTacToe, numPlayers: 2 }), []);

  useEffect(() => {
    client.start();
    return () => client.stop();
  }, [client]);

  const state = client.getState() as BGState | undefined;
  const cells = state?.G?.cells ?? Array(9).fill(null);
  const winner = state?.ctx?.gameover?.winner;
  const draw = Boolean(state?.ctx?.gameover?.draw);
  const currentPlayer = state?.ctx?.currentPlayer ?? "0";

  const onPlay = (i: number) => {
    if (winner || draw) return;
    if (currentPlayer !== player) return;
    client.moves.clickCell(i);
    setTick((v) => v + 1);
  };

  const reset = () => {
    client.reset();
    setTick((v) => v + 1);
  };

  return (
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <label class="text-sm">Jugador local:</label>
        <select
          class="rounded border px-2 py-1"
          value={player}
          onChange={(e) =>
            setPlayer((e.target as HTMLSelectElement).value as "0" | "1")}
        >
          <option value="0">Player 0 (X)</option>
          <option value="1">Player 1 (O)</option>
        </select>
        <button
          type="button"
          class="rounded bg-black px-3 py-1 text-white"
          onClick={reset}
        >
          Reiniciar
        </button>
      </div>

      <div class="grid grid-cols-3 gap-2 w-64">
        {cells.map((c: string | null, i: number) => (
          <button
            type="button"
            key={`${i}-${tick}`}
            onClick={() => onPlay(i)}
            class="h-20 rounded border text-3xl font-bold hover:bg-gray-100"
          >
            {c === "0" ? "X" : c === "1" ? "O" : ""}
          </button>
        ))}
      </div>

      <p class="text-sm text-gray-700">
        Turno actual: <b>{currentPlayer === "0" ? "X" : "O"}</b>
      </p>
      {winner && (
        <p class="font-semibold text-green-700">
          Ganador: {winner === "0" ? "X" : "O"}
        </p>
      )}
      {draw && <p class="font-semibold text-amber-700">Empate</p>}
    </div>
  );
}
