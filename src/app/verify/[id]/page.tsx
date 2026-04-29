"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

export default function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchRecord() {
      try {
        const res = await fetch(`/api/punch/${id}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setRecord(data.punchRecord);
      } catch (err) {
        console.error(err);
        setMessage("Could not load punch record.");
      } finally {
        setLoading(false);
      }
    }
    fetchRecord();
  }, [id]);

  const handleVerify = async (status: "VERIFIED" | "REJECTED") => {
    setUpdating(true);
    setMessage("");
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ punchId: id, status }),
      });

      const data = await res.json();
      if (res.ok) {
        setRecord({ ...record, status: data.status });
        setMessage(`Punch ${status.toLowerCase()} successfully!`);
      } else {
        setMessage(data.error || "Failed to update status.");
      }
    } catch (err) {
      console.error(err);
      setMessage("An error occurred.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-xl font-semibold text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-xl font-semibold text-red-600">{message || "Record not found."}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h1 className="text-xl font-bold text-white uppercase tracking-wider">
            Punch Verification
          </h1>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Driver</p>
              <p className="text-lg font-medium text-gray-900">{record.driver?.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vehicle</p>
              <p className="text-lg font-medium text-gray-900">{record.vehicle?.vehicleNumber}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Punch Type & Time</p>
            <p className="text-lg font-medium text-gray-900">
              {record.type} @ {new Date(record.timestamp).toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Odometer Reading</p>
            <p className="text-2xl font-bold text-blue-600">{record.odometer} km</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</p>
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${record.latitude},${record.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline flex items-center gap-2 mt-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              View on Google Maps
            </a>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Current Status</p>
            <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${
              record.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
              record.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
              record.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {record.status}
            </span>
          </div>

          {message && (
            <div className={`p-4 rounded-lg text-sm font-medium ${
              message.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}>
              {message}
            </div>
          )}

          {record.status === "PENDING" && !updating && (
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => handleVerify("VERIFIED")}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition duration-200 shadow-lg active:transform active:scale-95"
              >
                Verify
              </button>
              <button
                onClick={() => handleVerify("REJECTED")}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition duration-200 shadow-lg active:transform active:scale-95"
              >
                Reject
              </button>
            </div>
          )}

          {updating && (
            <div className="text-center py-4 text-gray-500 font-medium">
              Updating status...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
