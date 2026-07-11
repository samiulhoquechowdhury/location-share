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
    if (!confirm("Delete this entry?")) return;

    setDeletingId(id);
    const { error } = await supabase.from("sessions").delete().eq("id", id);
    setDeletingId(null);

    if (error) {
      alert("Failed to delete: " + error.message);
    }
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
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          History
        </h2>
        {history.length > 0 && (
          <button
            onClick={clearAll}
            disabled={clearingAll}
            className="text-xs font-medium text-red-500 hover:text-red-400 disabled:opacity-50"
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
          <div
            key={item.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatTime(item.created_at)}
              </span>
              <div className="flex items-center gap-3">
                <StatusBadge status={item.status} />
                <button
                  onClick={() => deleteOne(item.id)}
                  disabled={deletingId === item.id}
                  className="text-xs font-medium text-red-500 hover:text-red-400 disabled:opacity-50 border border-red-200 dark:border-red-900 rounded px-2 py-1"
                >
                  {deletingId === item.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>

            {item.status === "shared" && item.latitude && item.longitude && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
                </span>
                <a
                  href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline whitespace-nowrap ml-3"
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
