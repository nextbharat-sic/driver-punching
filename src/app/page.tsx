"use client";

import { useState, useEffect } from "react";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Input from "@/components/Input";
import Select from "@/components/Select";

type Driver = {
  id: string;
  name: string;
  phone: string;
  status: "IDLE" | "ACTIVE";
  isVerified: boolean;
};

type ClientUser = {
  id: string;
  name: string;
};

type Vehicle = {
  id: string;
  vehicleNumber: string;
};

type ActiveShift = {
  clientUser: ClientUser | null;
  vehicle: Vehicle | null;
  odometer: number;
};

export default function Home() {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [activeShift, setActiveShift] = useState<ActiveShift | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [odometer, setOdometer] = useState("");
  const [odoDigits, setOdoDigits] = useState(["", "", "", "", "", ""]);
  const [punching, setPunching] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState("");

  const [clientUsers, setClientUsers] = useState<ClientUser[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showUnverifiedPopup, setShowUnverifiedPopup] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    fetchStatus();
    fetchLists();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      if (data.driver) {
        setDriver(data.driver);
        setActiveShift(data.activeShift);
      }
    } catch (err) {
      console.error("Status fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLists = async () => {
    try {
      const [uRes, vRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/vehicles"),
      ]);
      const uData = await uRes.json();
      const vData = await vRes.json();
      setClientUsers(uData.users || []);
      setVehicles(vData.vehicles || []);
    } catch (err) {
      console.error("Lists fetch failed", err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        body: JSON.stringify({ name, phone }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.driver) {
        if (!data.driver.isVerified) {
          setShowUnverifiedPopup(true);
        } else {
          setDriver(data.driver);
          setActiveShift(data.activeShift);
        }
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleOdoChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d?$/.test(value)) return;

    const newDigits = [...odoDigits];
    newDigits[index] = value;
    setOdoDigits(newDigits);
    setOdometer(newDigits.join(""));

    if (value && index < 5) {
      const nextInput = document.getElementById(`odo-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOdoKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !odoDigits[index] && index > 0) {
      const prevInput = document.getElementById(`odo-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePunchClick = () => {
    console.log("[DEBUG] handlePunchClick: initiated", { odometer, status: driver?.status });
    if (odometer.length !== 6) {
      console.log("[DEBUG] handlePunchClick: validation failed - odometer length", odometer.length);
      setError("Please enter a 6-digit odometer reading");
      return;
    }
    if (driver?.status === "IDLE" && (!selectedUserId || !selectedVehicleId)) {
      console.log("[DEBUG] handlePunchClick: validation failed - user/vehicle not selected");
      setError("Please select user and vehicle");
      return;
    }
    console.log("[DEBUG] handlePunchClick: validation passed, showing confirmation modal");
    setError("");
    setShowConfirm(true);
  };

  const confirmPunch = async () => {
    console.log("[DEBUG] confirmPunch: flow started");
    setShowConfirm(false);
    setError("");
    console.log("[DEBUG] confirmPunch: setting punching = true");
    setPunching(true);

    if (!navigator.geolocation) {
      console.error("[DEBUG] confirmPunch: No geolocation support");
      setError("Geolocation is not supported by your browser");
      setPunching(false);
      return;
    }

    try {
      console.log("[DEBUG] confirmPunch: awaiting geolocation promise...");
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 30000,
          maximumAge: 60000
        });
      });

      console.log("[DEBUG] confirmPunch: geolocation resolved", { 
        lat: position.coords.latitude, 
        lng: position.coords.longitude 
      });
      
      setError(""); 
      const { latitude, longitude } = position.coords;
      const type = driver?.status === "ACTIVE" ? "OUT" : "IN";

      console.log("[DEBUG] confirmPunch: sending API request...", { type });
      const res = await fetch("/api/punch", {
        method: "POST",
        body: JSON.stringify({
          type,
          odometer,
          latitude,
          longitude,
          clientUserId: selectedUserId,
          vehicleId: selectedVehicleId,
        }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      console.log("[DEBUG] confirmPunch: API response received", { status: res.status, data });

      if (res.ok) {
        setError(""); 
        console.log("[DEBUG] confirmPunch: refreshing status");
        await fetchStatus();
        setOdometer("");
        setOdoDigits(["", "", "", "", "", ""]);
        if (type === "OUT") {
          setSelectedUserId("");
          setSelectedVehicleId("");
        }
        console.log("[DEBUG] confirmPunch: flow completed successfully");
      } else {
        setError(data.error || "Shift update failed");
        console.error("[DEBUG] confirmPunch: API logic error", data.error);
      }
    } catch (err: any) {
      console.error("[DEBUG] confirmPunch: caught error", err);
      let msg = "Shift update failed.";
      if (err.code === 1) msg = "Location access denied. Please enable GPS in your browser settings.";
      else if (err.code === 2) msg = "Location position unavailable.";
      else if (err.code === 3) msg = "Location request timed out.";
      else msg = err.message || "Network error. Please try again.";
      
      setError(msg);
    } finally {
      console.log("[DEBUG] confirmPunch: cleaning up punching state");
      setPunching(false);
    }
  };

  const handleLogout = () => {
    document.cookie = "driverId=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="mt-6 text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse">
            Establishing Connection
          </p>
        </div>
      </div>
    );
  }

  if (showUnverifiedPopup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 bg-grid-pattern">
        <Card variant="elevated" className="max-w-sm w-full text-center space-y-6">
          <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
            <span className="text-3xl">⏳</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Verification Pending</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Your account is currently under review. Access will be granted once verified by our team.
            </p>
          </div>
          <Button onClick={() => setShowUnverifiedPopup(false)} className="w-full">
            Dismiss
          </Button>
        </Card>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 bg-grid-pattern">
        <Card variant="elevated" className="max-w-md w-full p-10 space-y-12">
          <header className="space-y-8">
            <img 
              src="https://nextbharat.ventures/wp-content/uploads/2024/04/Frame-159788503034-1.png" 
              alt="Next Bharat" 
              className="h-10 w-auto"
            />
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Driver Portal</h1>
              <p className="text-gray-600 text-sm">Please identify yourself to proceed.</p>
            </div>
          </header>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-6">
              <Input
                label="Full Name"
                placeholder="Enter your name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Phone Number"
                type="tel"
                placeholder="00000 00000"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <p className="text-red-600 text-[10px] font-bold uppercase tracking-wider text-center">{error}</p>
              </div>
            )}

            <Button type="submit" isLoading={loginLoading} className="w-full">
              Login
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 bg-grid-pattern relative">
      {/* Global Punching Loader Overlay */}
      {punching && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-[200] flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="relative w-20 h-20 mb-8">
            <div className="absolute inset-0 border-8 border-gray-100 rounded-full"></div>
            <div className="absolute inset-0 border-8 border-black border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="space-y-2 text-center">
            <p className="text-xl font-black text-black uppercase tracking-[0.2em] animate-pulse">
              Processing
            </p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Securing Location & Updating Records
            </p>
          </div>
        </div>
      )}

      <Card variant="elevated" className={`max-w-md w-full p-8 min-h-[600px] flex flex-col relative overflow-hidden transition-all duration-700 ${punching ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'}`}>
        {/* Profile Header */}
        <div className="absolute top-8 right-8 z-10">
          <div className="relative group">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 transition-all duration-300 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </button>
            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white animate-pulse ${driver.status === "ACTIVE" ? "bg-green-500" : "bg-red-500"}`}></div>
            
            {showProfileMenu && (
              <div className="absolute right-0 mt-3 w-40 bg-white shadow-strong rounded-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-gray-50 mb-1">
                  <p className="text-[10px] font-bold text-gray-900 uppercase truncate">{driver.name}</p>
                  <p className="text-[8px] text-gray-500 font-bold uppercase">{driver.status}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-[10px] font-bold text-red-600 uppercase tracking-widest hover:bg-red-50 transition-colors"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>

        <header className="mb-12">
          <img 
            src="https://nextbharat.ventures/wp-content/uploads/2024/04/Frame-159788503034-1.png" 
            alt="Next Bharat" 
            className="h-10 w-auto mb-8"
          />
          <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Shift Control</h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Terminal ID: {driver.id.slice(-6).toUpperCase()}</p>
        </header>

        <div className="flex-1 space-y-10">
          {driver.status === "IDLE" ? (
            <div className="space-y-6 animate-in fade-in duration-500">
              <Select 
                label="Assignee User"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">Select individual...</option>
                {clientUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Select>

              <Select 
                label="Vehicle Unit"
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
              >
                <option value="">Select vehicle...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicleNumber}</option>)}
              </Select>
            </div>
          ) : (
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-4 animate-in slide-in-from-right-4 duration-500">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Active For</p>
                <p className="text-sm font-bold text-gray-900">{activeShift?.clientUser?.name}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Unit No.</p>
                <p className="text-sm font-bold text-gray-900">{activeShift?.vehicle?.vehicleNumber}</p>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Start Gauge</p>
                <p className="text-lg font-mono font-black text-gray-900">{activeShift?.odometer}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="text-center space-y-4">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">
                {driver.status === "ACTIVE" ? "End Gauge Reading" : "Start Gauge Reading"}
              </label>
              <div className="flex justify-center gap-3">
                {odoDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`odo-${idx}`}
                    type="text"
                    inputMode="numeric"
                    className="w-10 h-16 text-3xl text-center border-b-4 border-gray-100 focus:border-black outline-none bg-transparent transition-all font-black text-gray-900 placeholder:text-gray-100"
                    placeholder="0"
                    value={digit}
                    onChange={(e) => handleOdoChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOdoKeyDown(idx, e)}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 p-4 rounded-xl border border-red-100 animate-in shake duration-300">
                <p className="text-red-600 text-[10px] font-bold uppercase tracking-wider text-center">{error}</p>
              </div>
            )}

            <Button
              onClick={handlePunchClick}
              isLoading={punching}
              variant={driver.status === "ACTIVE" ? "danger" : "success"}
              className="w-full group"
            >
              <span className="group-hover:translate-x-1 transition-transform inline-block">
                {driver.status === "ACTIVE" ? "Terminate Shift" : "Initiate Shift"}
              </span>
            </Button>
          </div>
        </div>

        <footer className="mt-12 pt-8 border-t border-gray-50 flex justify-center opacity-20 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
           <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.5em]">Next Bharat Operations</p>
        </footer>

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in duration-300">
            <Card variant="elevated" className="max-w-xs w-full text-center p-10 space-y-8 animate-in zoom-in-95 duration-300">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Confirm Authorization</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  You are about to record a reading of <span className="font-black text-black underline decoration-2 underline-offset-4">{odometer}</span>. Continue?
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={confirmPunch}
                  variant={driver.status === "ACTIVE" ? "danger" : "success"}
                  className="w-full"
                  isLoading={punching}
                >
                  Verify & Proceed
                </Button>
                <Button 
                  onClick={() => setShowConfirm(false)}
                  variant="outline"
                  className="w-full"
                  disabled={punching}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
}
