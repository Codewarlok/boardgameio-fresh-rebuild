import type { LobbyRoomStatus } from "@/utils/lobby.ts";

interface Props {
  status: LobbyRoomStatus;
}

const STATUS_MAP: Record<LobbyRoomStatus, { label: string; cls: string }> = {
  waiting: { label: "Esperando", cls: "badge-warning" },
  in_progress: { label: "En juego", cls: "badge-success" },
  finished: { label: "Finalizada", cls: "badge-neutral" },
};

export default function RoomStatusBadge({ status }: Props) {
  const info = STATUS_MAP[status];
  return <span class={`badge ${info.cls}`}>{info.label}</span>;
}
