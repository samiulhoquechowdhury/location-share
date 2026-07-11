"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

type SessionData = {
  id: string;
  created_at: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
};

export default function Dashboard() {
  const [link, setLink] = useState<string | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [history, setHistory] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setHistory(data as SessionData[]);
    }
  };

  useEffect(() => {
    fetchHistory();

    // Listen for ALL changes on the table so history stays live too
    const historyChannel = supabase
      .channel("sessions-history")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions" },
        () => {
          fetchHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(historyChannel);
    };
  }, []);

  const generateLink = async () => {
    setLoading(true);
    setSession(null);

    const { data, error } = await supabase
      .from("sessions")
      .insert({ status: "pending" })
      .select()
      .single();

    setLoading(false);

    if (error || !data) {
      alert("Failed to create session: " + error?.message);
      return;
    }

    const url = `${window.location.origin}/share/${data.id}`;
    setLink(url);
    setSession(data);
    subscribeToSession(data.id);
  };

  const subscribeToSession = (id: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`session-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setSession(payload.new as SessionData);
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const copyLink = () => {
    if (link) {
      navigator.clipboard.writeText(link);
      alert("Link copied!");
    }
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleString();
  };

  return (
    <main
      style={{
        maxWidth: 560,
        margin: "60px auto",
        fontFamily: "sans-serif",
        paddingBottom: 60,
      }}
    >
      <h1>Location Share</h1>
      <p style={{ color: "#666" }}>
        Generate a link and send it to someone. If they choose to share,
        you&apos;ll see their location here.
      </p>

      <button
        onClick={generateLink}
        disabled={loading}
        style={{
          padding: "10px 20px",
          background: "#111",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        {loading ? "Generating..." : "Generate Link"}
      </button>

      {link && (
        <div style={{ marginTop: 20 }}>
          <input
            readOnly
            value={link}
            style={{ width: "100%", padding: 8 }}
            onFocus={(e) => e.target.select()}
          />
          <button onClick={copyLink} style={{ marginTop: 8 }}>
            Copy Link
          </button>
        </div>
      )}

      {session && (
        <div
          style={{
            marginTop: 30,
            padding: 16,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <p>
            <strong>Current link status:</strong> {session.status}
          </p>

          {session.status === "pending" && (
            <p>Waiting for the recipient to respond...</p>
          )}
          {session.status === "declined" && (
            <p>The recipient declined to share their location.</p>
          )}

          {session.status === "shared" &&
            session.latitude &&
            session.longitude && (
              <>
                <p>
                  <strong>Coordinates:</strong> {session.latitude.toFixed(6)},{" "}
                  {session.longitude.toFixed(6)}
                </p>
                {session.accuracy && (
                  <p>
                    <strong>Accuracy:</strong> ~{Math.round(session.accuracy)}m
                  </p>
                )}
                <a
                  href={`https://www.google.com/maps?q=${session.latitude},${session.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Google Maps
                </a>
                <iframe
                  width="100%"
                  height="250"
                  style={{ border: 0, marginTop: 12, borderRadius: 8 }}
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${session.latitude},${session.longitude}&z=15&output=embed`}
                />
              </>
            )}
        </div>
      )}

      <div style={{ marginTop: 50 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>History</h2>

        {history.length === 0 && (
          <p style={{ color: "#999" }}>No links generated yet.</p>
        )}

        {history.map((item) => (
          <div
            key={item.id}
            style={{
              padding: 12,
              border: "1px solid #eee",
              borderRadius: 8,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                color: "#666",
              }}
            >
              <span>{formatTime(item.created_at)}</span>
              <span
                style={{
                  color:
                    item.status === "shared"
                      ? "green"
                      : item.status === "declined"
                      ? "#b00"
                      : "#999",
                  fontWeight: 600,
                }}
              >
                {item.status}
              </span>
            </div>

            {item.status === "shared" && item.latitude && item.longitude && (
              <div style={{ marginTop: 8 }}>
                <p style={{ margin: "4px 0", fontSize: 14 }}>
                  {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
                  {item.accuracy && ` (±${Math.round(item.accuracy)}m)`}
                </p>
                <a
                  href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 13 }}
                >
                  View on Map
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
