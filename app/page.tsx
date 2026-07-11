"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

type SessionData = {
  id: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
};

export default function Dashboard() {
  const [link, setLink] = useState<string | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

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

  return (
    <main
      style={{ maxWidth: 480, margin: "60px auto", fontFamily: "sans-serif" }}
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
            <strong>Status:</strong> {session.status}
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
    </main>
  );
}
