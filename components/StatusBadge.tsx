import { SessionStatus } from "@/lib/types";

const STYLES: Record<SessionStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  shared: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
};

export default function StatusBadge({ status }: { status: SessionStatus }) {
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
