"use client";

import { useState, useEffect } from "react";

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
    if (odometer.length !== 6) {
      setError("Please enter a 6-digit odometer reading");
      return;
    }
    if (driver?.status === "IDLE" && (!selectedUserId || !selectedVehicleId)) {
      setError("Please select user and vehicle");
      return;
    }
    setError("");
    setShowConfirm(true);
  };

  const confirmPunch = async () => {
    setShowConfirm(false);
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
        const type = driver?.status === "ACTIVE" ? "OUT" : "IN";

        try {
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

          if (res.ok) {
            fetchStatus();
            setOdometer("");
            setOdoDigits(["", "", "", "", "", ""]);
            if (type === "OUT") {
              setSelectedUserId("");
              setSelectedVehicleId("");
            }
          } else {
            setError(data.error || "Punch failed");
          }
        } catch {
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

  const handleLogout = () => {
    document.cookie = "driverId=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white max-w-md mx-auto shadow-xl">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full mb-4"></div>
          <p className="text-gray-500 text-sm font-medium tracking-widest uppercase">Loading</p>
        </div>
      </div>
    );
  }

  if (showUnverifiedPopup) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full bg-white text-center max-w-md mx-auto shadow-xl">
        <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-6">
          <span className="text-2xl">⏳</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Pending</h2>
        <p className="text-gray-600 text-sm mb-8">We will verify you shortly. Please check back later.</p>
        <button 
          onClick={() => setShowUnverifiedPopup(false)}
          className="w-full bg-black text-white py-4 rounded-sm text-xs font-bold uppercase tracking-widest"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="p-8 flex flex-col h-full bg-white max-w-md w-full shadow-xl">
          <div className="mb-12 flex justify-start">
            <img 
              src="https://nextbharat.ventures/wp-content/uploads/2024/04/Frame-159788503034-1.png" 
              alt="Next Bharat" 
              className="h-8 w-auto"
            />
          </div>
          
          <div className="space-y-1 mb-8">
            <h1 className="text-xl font-semibold text-gray-900 uppercase tracking-tight">Driver Logging System</h1>
            <p className="text-gray-600 text-sm">Enter your details to manage your shift.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Full Name</label>
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
              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Phone Number</label>
              <input
                type="tel"
                required
                className="w-full border-b border-gray-200 focus:border-black outline-none py-2 transition-colors duration-300 bg-transparent text-gray-800"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98765 43210"
              />
            </div>
            {error && <p className="text-red-600 text-[10px] font-bold uppercase tracking-tighter">{error}</p>}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-black text-white py-4 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-gray-900 transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
            >
              {loginLoading && (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              )}
              {loginLoading ? "Submitting..." : "Submit"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 flex items-center justify-center">
      <div className="p-8 flex flex-col h-full bg-white max-w-md w-full relative shadow-xl">
        <div className="absolute top-8 right-8 flex flex-col items-end">
          <div className="relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </button>
          <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${driver.status === "ACTIVE" ? "bg-green-500" : "bg-red-500"}`}></div>
          
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-32 bg-white shadow-xl rounded-sm border border-gray-100 z-50">
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-[10px] font-bold text-red-600 uppercase tracking-widest hover:bg-red-50"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
        <p className="text-[8px] font-bold text-gray-600 mt-1 uppercase tracking-widest">{driver.name}</p>
      </div>

      <header className="flex flex-col items-start mb-12 pt-4">
        <img 
          src="https://nextbharat.ventures/wp-content/uploads/2024/04/Frame-159788503034-1.png" 
          alt="Next Bharat" 
          className="h-8 w-auto mb-6"
        />
        <h1 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Driver Logging System</h1>
      </header>

      <div className="flex-1 flex flex-col justify-center space-y-8">
        {driver.status === "IDLE" ? (
          <>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Select User</label>
                <select 
                  className="w-full border-b border-gray-200 py-2 bg-transparent outline-none focus:border-black text-gray-800"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">Choose a user...</option>
                  {clientUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Select Vehicle</label>
                <select 
                  className="w-full border-b border-gray-200 py-2 bg-transparent outline-none focus:border-black text-gray-800"
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                >
                  <option value="">Choose a vehicle...</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicleNumber}</option>)}
                </select>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-gray-50 p-4 rounded-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-bold text-gray-600 uppercase">Current User</p>
              <p className="text-sm font-medium">{activeShift?.clientUser?.name}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-bold text-gray-600 uppercase">Vehicle</p>
              <p className="text-sm font-medium">{activeShift?.vehicle?.vehicleNumber}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-bold text-gray-600 uppercase">Start Odometer</p>
              <p className="text-sm font-medium">{activeShift?.odometer}</p>
            </div>
          </div>
        )}

        <div className="space-y-4 text-center">
          <label className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">
            {driver.status === "ACTIVE" ? "End Odometer Reading" : "Start Odometer Reading"}
          </label>
          <div className="flex justify-between gap-2">
            {odoDigits.map((digit, idx) => (
              <input
                key={idx}
                id={`odo-${idx}`}
                type="text"
                inputMode="numeric"
                className="w-10 h-14 text-2xl text-center border-b-2 border-gray-200 focus:border-black outline-none bg-transparent transition-all font-semibold"
                placeholder="-"
                value={digit}
                onChange={(e) => handleOdoChange(idx, e.target.value)}
                onKeyDown={(e) => handleOdoKeyDown(idx, e)}
              />
            ))}
          </div>
        </div>

        {error && <p className="text-red-600 text-[10px] font-bold uppercase text-center tracking-tight bg-red-50 py-2 rounded">{error}</p>}

        <button
          onClick={handlePunchClick}
          disabled={punching}
          className={`w-full py-5 rounded-sm text-xs font-bold uppercase tracking-[0.3em] text-white transition-all active:scale-[0.97] flex items-center justify-center gap-3 ${
            driver.status === "ACTIVE"
              ? "bg-red-600 shadow-lg shadow-red-100"
              : "bg-green-600 shadow-lg shadow-green-100"
          } ${punching ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"}`}
        >
          {punching && (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          )}
          {punching ? "Processing..." : driver.status === "ACTIVE" ? "End Shift" : "Start Shift"}
        </button>
      </div>

      <footer className="mt-auto pt-8 flex justify-center invisible">
        {/* Placeholder for spacing */}
        <div className="h-4"></div>
      </footer>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-sm shadow-xl max-w-xs w-full text-center">
            <h3 className="text-lg font-bold mb-4 uppercase tracking-tight">Confirm {driver.status === "ACTIVE" ? "End" : "Start"}</h3>
            <p className="text-gray-600 text-sm mb-8">Are you sure you want to {driver.status === "ACTIVE" ? "end" : "start"} your shift with odometer reading <span className="font-bold text-black">{odometer}</span>?</p>
            <div className="flex gap-4">
              <button 
                onClick={confirmPunch}
                className={`flex-1 py-3 text-xs font-bold uppercase text-white rounded-sm ${driver.status === "ACTIVE" ? "bg-red-600" : "bg-green-600"}`}
              >
                Confirm
              </button>
              <button 
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 text-xs font-bold uppercase text-gray-500 hover:text-black"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
}
