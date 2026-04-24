"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

type User = {
  id: string;
  name: string;
  phone: string;
  status: "IDLE" | "ACTIVE";
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [odometer, setOdometer] = useState("");
  const [punching, setPunching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch((err) => console.error("Status fetch failed", err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      body: JSON.stringify({ name, phone }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (data.user) {
      setUser(data.user);
    } else {
      setError(data.error || "Login failed");
    }
  };

  const handlePunch = async () => {
    if (!odometer) {
      setError("Odometer reading is required");
      return;
    }
    setError("");
    setPunching(true);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported");
      setPunching(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const type = user?.status === "ACTIVE" ? "OUT" : "IN";

        try {
          const res = await fetch("/api/punch", {
            method: "POST",
            body: JSON.stringify({
              type,
              odometer,
              latitude,
              longitude,
            }),
            headers: { "Content-Type": "application/json" },
          });

          const data = await res.json();

          if (res.ok) {
            setUser((prev) => (prev ? { ...prev, status: type === "IN" ? "ACTIVE" : "IDLE" } : null));
            setOdometer("");
          } else {
            setError(data.error || "Punch failed");
          }
        } catch (err) {
          setError("Network error. Please try again.");
        } finally {
          setPunching(false);
        }
      },
      (err) => {
        setError(`Location access denied: ${err.message}`);
        setPunching(false);
      },
      { enableHighAccuracy: true }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full mb-4"></div>
          <p className="text-gray-300 text-sm font-medium tracking-widest uppercase">Loading</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 flex flex-col justify-center h-full bg-white max-w-sm mx-auto">
        <div className="mb-12 flex justify-center">
          <img 
            src="https://nextbharat.ventures/wp-content/uploads/2024/04/Frame-159788503034-1.png" 
            alt="Next Bharat" 
            className="h-16 w-auto"
          />
        </div>
        
        <div className="space-y-1 mb-8">
          <h1 className="text-xl font-semibold text-gray-900">Sign In</h1>
          <p className="text-gray-500 text-sm">Enter your details to manage your shift.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              required
              className="w-full border-b border-gray-200 focus:border-black outline-none py-2 transition-colors duration-300 bg-transparent text-gray-800"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone Number</label>
            <input
              type="tel"
              required
              className="w-full border-b border-gray-200 focus:border-black outline-none py-2 transition-colors duration-300 bg-transparent text-gray-800"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="98765 43210"
            />
          </div>
          {error && <p className="text-red-500 text-[10px] font-bold uppercase tracking-tighter">{error}</p>}
          <button
            type="submit"
            className="w-full bg-black text-white py-4 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-gray-900 transition-all active:scale-[0.98] shadow-sm"
          >
            Enter Dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-8 flex flex-col h-full bg-white max-w-sm mx-auto">
      <header className="flex flex-col items-center mb-16 pt-4">
        <img 
          src="https://nextbharat.ventures/wp-content/uploads/2024/04/Frame-159788503034-1.png" 
          alt="Next Bharat" 
          className="h-10 w-auto mb-8"
        />
        <div className="text-center space-y-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Logged in as</p>
          <h2 className="text-xl font-medium text-gray-900">{user.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className={`w-1.5 h-1.5 rounded-full ${user.status === "ACTIVE" ? "bg-green-500 animate-pulse" : "bg-gray-300"}`}></div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{user.status}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center space-y-12">
        <div className="space-y-4 text-center">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
            Odometer Reading
          </label>
          <input
            type="number"
            inputMode="decimal"
            className="block w-full text-4xl text-center outline-none border-b border-gray-100 focus:border-black py-4 font-light tracking-tighter transition-all"
            placeholder="0.0"
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
          />
        </div>

        {error && <p className="text-red-500 text-[10px] font-bold uppercase text-center tracking-tight bg-red-50 py-2 rounded">{error}</p>}

        <button
          onClick={handlePunch}
          disabled={punching}
          className={`w-full py-5 rounded-sm text-xs font-bold uppercase tracking-[0.3em] text-white transition-all active:scale-[0.97] ${
            user.status === "ACTIVE"
              ? "bg-red-500 shadow-lg shadow-red-100"
              : "bg-black shadow-lg shadow-gray-200"
          } ${punching ? "opacity-20 cursor-not-allowed" : "hover:opacity-90"}`}
        >
          {punching ? "Processing..." : user.status === "ACTIVE" ? "End Shift" : "Start Shift"}
        </button>
        
        {user.status === "IDLE" && (
           <p className="text-[9px] text-center text-gray-300 uppercase tracking-widest leading-relaxed">
             Shift must be started<br/>within depot vicinity.
           </p>
        )}
      </div>

      <footer className="mt-auto pt-8 flex justify-center">
        <button 
          onClick={() => {
            document.cookie = "userId=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
            window.location.reload();
          }}
          className="text-[10px] font-bold text-gray-300 uppercase tracking-widest hover:text-black transition-colors"
        >
          Log Out
        </button>
      </footer>
    </div>
  );
}
