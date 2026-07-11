import { SessionData } from "@/lib/types";
import StatusBadge from "./StatusBadge";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString();
}

export default function HistoryList({ history }: { history: SessionData[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">History</h2>

      {history.length === 0 && (
        <p className="text-sm text-gray-400 mt-3">No links generated yet.</p>
      )}

      <div className="mt-4 space-y-3">
        {history.map((item) => (
          <div key={item.id} className="border border-gray-100 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {formatTime(item.created_at)}
              </span>
              <StatusBadge status={item.status} />
            </div>

            {item.status === "shared" && item.latitude && item.longitude && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
                </span>
                <a
                  href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline whitespace-nowrap ml-3"
                >
                  View
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
