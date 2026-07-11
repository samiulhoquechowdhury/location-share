"use client";

import { useState } from "react";

export default function GenerateLinkCard({
  onGenerate,
  loading,
}: {
  onGenerate: () => void;
  loading: boolean;
}) {
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLink(null);
    setCopied(false);
    const url = await onGenerate();
    if (url) setLink(url);
  };

  const copyLink = () => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Generate a link</h2>
      <p className="text-sm text-gray-500 mt-1">
        Send it to someone. They&apos;ll be asked for consent before anything is
        shared.
      </p>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="mt-4 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition"
      >
        {loading ? "Generating..." : "Generate Link"}
      </button>

      {link && (
        <div className="mt-4 flex gap-2">
          <input
            readOnly
            value={link}
            onFocus={(e) => e.target.select()}
            className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
          />
          <button
            onClick={copyLink}
            className="px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition whitespace-nowrap"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}
