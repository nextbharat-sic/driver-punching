"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Driver = {
  id: string;
  name: string;
  phone: string;
  isVerified: boolean;
  status: string;
};

type ClientUser = {
  id: string;
  name: string;
  email: string;
};

type Vehicle = {
  id: string;
  vehicleNumber: string;
};

type Record = {
  id: string;
  driver: Driver;
  clientUser: ClientUser | null;
  vehicle: Vehicle | null;
  type: string;
  odometer: number;
  timestamp: string;
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("drivers");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Form states
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newVehicleNumber, setNewVehicleNumber] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dRes, uRes, vRes, rRes] = await Promise.all([
        fetch("/api/admin/drivers"),
        fetch("/api/admin/users"),
        fetch("/api/admin/vehicles"),
        fetch("/api/admin/records"),
      ]);

      if (dRes.status === 401) {
        router.push("/admin/login");
        return;
      }

      const dData = await dRes.json();
      const uData = await uRes.json();
      const vData = await vRes.json();
      const rData = await rRes.json();

      setDrivers(dData.drivers || []);
      setUsers(uData.users || []);
      setVehicles(vData.vehicles || []);
      setRecords(rData.records || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleVerify = async (id: string, current: boolean) => {
    await fetch("/api/admin/drivers", {
      method: "PATCH",
      body: JSON.stringify({ id, isVerified: !current }),
      headers: { "Content-Type": "application/json" },
    });
    fetchData();
  };

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/users", {
      method: "POST",
      body: JSON.stringify({ name: newUserName, email: newUserEmail }),
      headers: { "Content-Type": "application/json" },
    });
    setNewUserName("");
    setNewUserEmail("");
    fetchData();
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    await fetch("/api/admin/users", {
      method: "DELETE",
      body: JSON.stringify({ id }),
      headers: { "Content-Type": "application/json" },
    });
    fetchData();
  };

  const addVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/vehicles", {
      method: "POST",
      body: JSON.stringify({ vehicleNumber: newVehicleNumber }),
      headers: { "Content-Type": "application/json" },
    });
    setNewVehicleNumber("");
    fetchData();
  };

  const deleteVehicle = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    await fetch("/api/admin/vehicles", {
      method: "DELETE",
      body: JSON.stringify({ id }),
      headers: { "Content-Type": "application/json" },
    });
    fetchData();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
      <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <img 
            src="https://nextbharat.ventures/wp-content/uploads/2024/04/Frame-159788503034-1.png" 
            alt="Next Bharat" 
            className="h-10 w-auto"
          />
          <div className="h-8 w-[1px] bg-gray-200 mx-2"></div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
        </div>
        <button 
          onClick={async () => {
            await fetch("/api/admin/auth", { method: "DELETE" });
            router.push("/admin/login");
          }}
          className="text-sm text-gray-500 hover:text-red-600 font-semibold transition-colors px-4 py-2 rounded-md hover:bg-red-50"
        >
          Logout
        </button>
      </nav>

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Total Drivers", value: drivers.length, color: "blue" },
            { label: "Active Shifts", value: drivers.filter(d => d.status === "ACTIVE").length, color: "green" },
            { label: "Total Users", value: users.length, color: "purple" },
            { label: "Total Vehicles", value: vehicles.length, color: "orange" },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex gap-8 px-6 pt-6 border-b border-gray-100 overflow-x-auto">
            {["drivers", "users", "vehicles", "records"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-2 capitalize text-sm font-semibold transition-all relative ${
                  activeTab === tab 
                    ? "text-blue-600" 
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === "drivers" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                      <th className="px-4 py-3 pb-4">Name</th>
                      <th className="px-4 py-3 pb-4">Phone</th>
                      <th className="px-4 py-3 pb-4">Status</th>
                      <th className="px-4 py-3 pb-4 text-center">Verified</th>
                      <th className="px-4 py-3 pb-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {drivers.map((d) => (
                      <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-4 font-medium text-gray-900">{d.name}</td>
                        <td className="px-4 py-4 text-gray-500">{d.phone}</td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            d.status === "ACTIVE" 
                              ? "bg-green-100 text-green-700" 
                              : "bg-gray-100 text-gray-500"
                          }`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-xl">{d.isVerified ? "✅" : "❌"}</td>
                        <td className="px-4 py-4 text-right">
                          <button 
                            onClick={() => toggleVerify(d.id, d.isVerified)}
                            className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-md transition-colors ${
                              d.isVerified 
                                ? "bg-red-50 text-red-600 hover:bg-red-100" 
                                : "bg-green-50 text-green-600 hover:bg-green-100"
                            }`}
                          >
                            {d.isVerified ? "Unverify" : "Verify"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "users" && (
              <div className="space-y-8">
                <form onSubmit={addUser} className="bg-gray-50 p-6 rounded-xl flex gap-4 items-end max-w-4xl border border-gray-100">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2 tracking-wider">User Full Name</label>
                    <input 
                      className="w-full border-gray-200 border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                      value={newUserName} 
                      onChange={e => setNewUserName(e.target.value)} 
                      required
                      placeholder="e.g. Ronit Roy"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2 tracking-wider">Email Address</label>
                    <input 
                      type="email"
                      className="w-full border-gray-200 border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                      value={newUserEmail} 
                      onChange={e => setNewUserEmail(e.target.value)} 
                      required
                      placeholder="ronit@example.com"
                    />
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold text-sm transition-all shadow-sm">Add User</button>
                </form>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-t border-gray-50">
                    <thead>
                      <tr className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                        <th className="px-4 py-6">Name</th>
                        <th className="px-4 py-6">Email</th>
                        <th className="px-4 py-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-4 font-medium text-gray-900">{u.name}</td>
                          <td className="px-4 py-4 text-gray-500">{u.email}</td>
                          <td className="px-4 py-4 text-right">
                            <button 
                              onClick={() => deleteUser(u.id)}
                              className="text-[10px] font-bold uppercase text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md transition-all"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "vehicles" && (
              <div className="space-y-8">
                <form onSubmit={addVehicle} className="bg-gray-50 p-6 rounded-xl flex gap-4 items-end max-w-md border border-gray-100">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2 tracking-wider">Vehicle Number</label>
                    <input 
                      className="w-full border-gray-200 border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                      value={newVehicleNumber} 
                      onChange={e => setNewVehicleNumber(e.target.value)} 
                      required
                      placeholder="KA 01 AB 1234"
                    />
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold text-sm transition-all shadow-sm">Add</button>
                </form>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-t border-gray-50">
                    <thead>
                      <tr className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                        <th className="px-4 py-6">Vehicle Number</th>
                        <th className="px-4 py-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {vehicles.map((v) => (
                        <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-4 font-medium text-gray-900">{v.vehicleNumber}</td>
                          <td className="px-4 py-4 text-right">
                            <button 
                              onClick={() => deleteVehicle(v.id)}
                              className="text-[10px] font-bold uppercase text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md transition-all"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "records" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                      <th className="px-4 py-3 pb-6">Time</th>
                      <th className="px-4 py-3 pb-6">Driver</th>
                      <th className="px-4 py-3 pb-6">User</th>
                      <th className="px-4 py-3 pb-6">Vehicle</th>
                      <th className="px-4 py-3 pb-6">Type</th>
                      <th className="px-4 py-3 pb-6 text-right">Odometer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {records.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-4 text-sm text-gray-500">{new Date(r.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-4 font-medium text-gray-900">{r.driver.name}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{r.clientUser?.name || "-"}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{r.vehicle?.vehicleNumber || "-"}</td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            r.type === "IN" ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700"
                          }`}>
                            {r.type}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-sm text-gray-900">{r.odometer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
