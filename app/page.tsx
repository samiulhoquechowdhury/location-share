"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { SessionData } from "@/lib/types";
import GenerateLinkCard from "@/components/GenerateLinkCard";
import CurrentSessionCard from "@/components/CurrentSessionCard";
import HistoryList from "@/components/HistoryList";

export default function Dashboard() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [history, setHistory] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(false);
  const sessionChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(
    null
  );

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setHistory(data as SessionData[]);
  };

  useEffect(() => {
    fetchHistory();

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

  const subscribeToSession = (id: string) => {
    if (sessionChannelRef.current) {
      supabase.removeChannel(sessionChannelRef.current);
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
        (payload) => setSession(payload.new as SessionData)
      )
      .subscribe();

    sessionChannelRef.current = channel;
  };

  const handleGenerate = async (): Promise<string | null> => {
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
      return null;
    }

    setSession(data as SessionData);
    subscribeToSession(data.id);
    return `${window.location.origin}/share/${data.id}`;
  };

  useEffect(() => {
    return () => {
      if (sessionChannelRef.current)
        supabase.removeChannel(sessionChannelRef.current);
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Location Share</h1>
          <p className="text-sm text-gray-500 mt-1">
            Generate a link, send it, and see shared locations here in real
            time.
          </p>
        </div>

        <GenerateLinkCard onGenerate={handleGenerate} loading={loading} />

        {session && <CurrentSessionCard session={session} />}

        <HistoryList history={history} />
      </div>
    </main>
  );
}
