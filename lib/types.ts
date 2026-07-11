export type SessionStatus = "pending" | "shared" | "declined";

export type SessionData = {
  id: string;
  created_at: string;
  status: SessionStatus;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
};
