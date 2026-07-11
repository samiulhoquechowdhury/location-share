import { SessionData } from "@/lib/types";
import StatusBadge from "./StatusBadge";

export default function CurrentSessionCard({
  session,
}: {
  session: SessionData;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Active link</h2>
        <StatusBadge status={session.status} />
      </div>

      {session.status === "pending" && (
        <p className="text-sm text-gray-500 mt-3">
          Waiting for the recipient to respond...
        </p>
      )}

      {session.status === "declined" && (
        <p className="text-sm text-gray-500 mt-3">
          The recipient declined to share their location.
        </p>
      )}

      {session.status === "shared" && session.latitude && session.longitude && (
        <div className="mt-3">
          <p className="text-sm text-gray-700">
            <span className="font-medium">
              {session.latitude.toFixed(6)}, {session.longitude.toFixed(6)}
            </span>
            {session.accuracy && (
              <span className="text-gray-400">
                {" "}
                (±{Math.round(session.accuracy)}m)
              </span>
            )}
          </p>
          <a
            href={`https://www.google.com/maps?q=${session.latitude},${session.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            View on Google Maps
          </a>
          <iframe
            width="100%"
            height="250"
            style={{ border: 0 }}
            loading="lazy"
            className="mt-3 rounded-lg"
            src={`https://maps.google.com/maps?q=${session.latitude},${session.longitude}&z=15&output=embed`}
          />
        </div>
      )}
    </div>
  );
}
