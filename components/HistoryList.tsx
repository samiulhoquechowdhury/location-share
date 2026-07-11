"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { SessionData } from "@/lib/types";
import StatusBadge from "./StatusBadge";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString();
}

export default function HistoryList({ history }: { history: SessionData[] }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  const deleteOne = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from("sessions").delete().eq("id", id);
    setDeletingId(null);

    if (error) {
      alert("Failed to delete: " + error.message);
    }
    // No need to manually update state — the realtime subscription
    // on the parent will pick up the DELETE event and refresh history
  };

  const clearAll = async () => {
    if (!confirm(`Delete all ${history.length} entries? This can't be undone.`))
      return;

    setClearingAll(true);
    const { error } = await supabase
      .from("sessions")
      .delete()
      .in(
        "id",
        history.map((h) => h.id)
      );
    setClearingAll(false);

    if (error) {
      alert("Failed to clear history: " + error.message);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">History</h2>
        {history.length > 0 && (
          <button
            onClick={clearAll}
            disabled={clearingAll}
            className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            {clearingAll ? "Clearing..." : "Clear all"}
          </button>
        )}
      </div>

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
              <div className="flex items-center gap-2">
                <StatusBadge status={item.status} />
                <button
                  onClick={() => deleteOne(item.id)}
                  disabled={deletingId === item.id}
                  className="text-gray-400 hover:text-red-600 disabled:opacity-50 transition"
                  title="Delete this entry"
                >
                  {deletingId === item.id ? (
                    <span className="text-xs">...</span>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  )}
                </button>
              </div>
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
