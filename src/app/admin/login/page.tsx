"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Input from "@/components/Input";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        body: JSON.stringify({ username, password }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        router.push("/admin");
      } else {
        setError("Invalid credentials or unauthorized access");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 bg-grid-pattern p-6">

      <Card variant="elevated" className="w-full max-w-md p-10 space-y-12">
        <header className="space-y-8 text-center">
          <img 
            src="https://nextbharat.ventures/wp-content/uploads/2024/04/Frame-159788503034-1.png" 
            alt="Next Bharat" 
            className="h-10 w-auto mx-auto"
          />
          <div className="space-y-1">
            <h1 className="text-xl font-black uppercase tracking-widest text-gray-900">Control Center</h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Administrative Authentication</p>
          </div>
        </header>

        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-6">
            <Input
              label="Admin ID"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <Input
              label="Access Key"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 animate-in shake duration-300">
              <p className="text-red-600 text-[10px] font-bold uppercase tracking-wider text-center">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            isLoading={loading}
            className="w-full"
          >
            Authorize Access
          </Button>
        </form>

        <footer className="text-center opacity-30">
          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-400">Secure Environment</p>
        </footer>
      </Card>
    </div>
  );
}
