"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Input from "@/components/Input";

type Driver = {
  id: string;
  name: string;
  phone: string;
  isVerified: boolean;
  status: string;
  deviceId: string | null;
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
  status: string;
  rideId: string;
};

type Ride = {
  rideId: string;
  driver: Driver;
  clientUser: ClientUser | null;
  vehicle: Vehicle | null;
  startRecord: Record;
  endRecord?: Record;
  totalKms?: number;
  totalHrs?: string;
  status: string;
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("drivers");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Filters
  const [filterDriver, setFilterDriver] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

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

  const getRides = (): Ride[] => {
    const rideMap = new Map<string, Ride>();

    // Process IN records first to establish rides
    records.filter(r => r.type === "IN").forEach(r => {
      rideMap.set(r.rideId, {
        rideId: r.rideId,
        driver: r.driver,
        clientUser: r.clientUser,
        vehicle: r.vehicle,
        startRecord: r,
        status: r.status
      });
    });

    // Match OUT records
    records.filter(r => r.type === "OUT").forEach(r => {
      const ride = rideMap.get(r.rideId);
      if (ride) {
        ride.endRecord = r;
        ride.totalKms = r.odometer - ride.startRecord.odometer;
        const durationMs = new Date(r.timestamp).getTime() - new Date(ride.startRecord.timestamp).getTime();
        ride.totalHrs = (durationMs / (1000 * 60 * 60)).toFixed(2);
      }
    });

    let rides = Array.from(rideMap.values()).sort((a, b) => 
      new Date(b.startRecord.timestamp).getTime() - new Date(a.startRecord.timestamp).getTime()
    );

    // Apply filters
    if (filterDriver) {
      rides = rides.filter(r => r.driver.id === filterDriver);
    }
    if (filterStatus) {
      rides = rides.filter(r => r.status === filterStatus);
    }

    return rides;
  };

  const toggleVerify = async (id: string, current: boolean) => {
    await fetch("/api/admin/drivers", {
      method: "PATCH",
      body: JSON.stringify({ id, isVerified: !current }),
      headers: { "Content-Type": "application/json" },
    });
    fetchData();
  };

  const resetDevice = async (id: string) => {
    if (!confirm("Are you sure you want to unbind this device? The driver will be able to log in on a new phone.")) return;
    await fetch("/api/admin/drivers", {
      method: "PATCH",
      body: JSON.stringify({ id, deviceId: null }),
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
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">Synchronizing Data</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 bg-grid-pattern">
      <nav className="glass border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <img 
            src="https://nextbharat.ventures/wp-content/uploads/2024/04/Frame-159788503034-1.png" 
            alt="Next Bharat" 
            className="h-8 w-auto"
          />
          <div className="h-6 w-[1px] bg-gray-200 hidden md:block"></div>
          <h1 className="text-sm font-black uppercase tracking-widest text-gray-900 hidden md:block">Control Center</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchData}
            className="p-2 text-gray-400 hover:text-black transition-colors"
            title="Refresh Data"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
          <Button 
            variant="outline"
            size="sm"
            onClick={async () => {
              await fetch("/api/admin/auth", { method: "DELETE" });
              router.push("/admin/login");
            }}
          >
            Exit
          </Button>
        </div>
      </nav>

      <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          {[
            { label: "Total Drivers", value: drivers.length, icon: "👤" },
            { label: "Active Shifts", value: drivers.filter(d => d.status === "ACTIVE").length, icon: "⚡" },
            { label: "Pending Rides", value: records.filter(r => r.status === "PENDING").length, icon: "⏳" },
            { label: "Total Users", value: users.length, icon: "🏢" },
            { label: "Fleet Size", value: vehicles.length, icon: "🚛" },
          ].map((stat, i) => (
            <Card key={i} variant="elevated" className="relative overflow-hidden group hover:border-black transition-all">
              <div className="absolute -right-4 -top-4 text-4xl opacity-5 group-hover:opacity-10 transition-opacity">{stat.icon}</div>
              <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-2">{stat.label}</p>
              <p className="text-3xl font-black text-gray-900">{stat.value}</p>
            </Card>
          ))}
        </div>

        <Card variant="elevated" className="overflow-hidden p-0 border-none shadow-strong">
          <div className="flex flex-wrap gap-4 md:gap-8 px-6 pt-6 border-b border-gray-100 bg-white">
            {["drivers", "users", "vehicles", "records"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-2 capitalize text-[10px] font-black tracking-widest uppercase transition-all relative ${
                  activeTab === tab 
                    ? "text-black" 
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab === "records" ? "Rides" : tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black rounded-t-full animate-in slide-in-from-bottom-1"></div>
                )}
              </button>
            ))}
          </div>

          <div className="p-6 bg-white min-h-[400px]">
            {activeTab === "drivers" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-50">
                      <th className="px-4 py-4">Identity</th>
                      <th className="px-4 py-4">Contact</th>
                      <th className="px-4 py-4">Operation Status</th>
                      <th className="px-4 py-4 text-center">Auth</th>
                      <th className="px-4 py-4 text-center">Device</th>
                      <th className="px-4 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {drivers.map((d) => (
                      <tr key={d.id} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-5 font-bold text-gray-900">{d.name}</td>
                        <td className="px-4 py-5 text-sm text-gray-500 font-medium">{d.phone}</td>
                        <td className="px-4 py-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            d.status === "ACTIVE" 
                              ? "bg-green-50 text-green-700 border border-green-100" 
                              : "bg-gray-50 text-gray-400 border border-gray-100"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${d.status === "ACTIVE" ? "bg-green-500 animate-pulse" : "bg-gray-300"}`}></span>
                            {d.status}
                          </span>
                        </td>
                        <td className="px-4 py-5 text-center">
                          {d.isVerified ? (
                            <span className="text-green-500 text-lg">●</span>
                          ) : (
                            <span className="text-red-500 text-lg">○</span>
                          )}
                        </td>
                        <td className="px-4 py-5 text-center">
                          {d.deviceId ? (
                            <div className="flex flex-col items-center gap-2">
                              <code className="text-[10px] font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">
                                {d.deviceId.slice(0, 8)}
                              </code>
                              <button 
                                onClick={() => resetDevice(d.id)}
                                className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-all"
                              >
                                Reset Binding
                              </button>
                            </div>
                          ) : (
                            <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest italic bg-gray-50 px-2 py-1 rounded">
                              Unbound
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-5 text-right">
                          <Button 
                            variant={d.isVerified ? "outline" : "primary"}
                            size="sm"
                            onClick={() => toggleVerify(d.id, d.isVerified)}
                            className="text-[9px]"
                          >
                            {d.isVerified ? "Revoke" : "Authorize"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "users" && (
              <div className="space-y-8">
                <Card variant="flat" className="bg-gray-50/50 border-dashed border-2">
                  <form onSubmit={addUser} className="flex flex-col md:flex-row gap-6 items-end">
                    <div className="flex-1 w-full">
                      <Input 
                        label="Collaborator Name"
                        value={newUserName} 
                        onChange={e => setNewUserName(e.target.value)} 
                        required
                        placeholder="Full name"
                      />
                    </div>
                    <div className="flex-1 w-full">
                      <Input 
                        type="email"
                        label="Official Email"
                        value={newUserEmail} 
                        onChange={e => setNewUserEmail(e.target.value)} 
                        required
                        placeholder="email@organization.com"
                      />
                    </div>
                    <Button type="submit" size="md" className="w-full md:w-auto">Register User</Button>
                  </form>
                </Card>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-50">
                        <th className="px-4 py-4">Name</th>
                        <th className="px-4 py-4">Email Address</th>
                        <th className="px-4 py-4 text-right">Management</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-5 font-bold text-gray-900">{u.name}</td>
                          <td className="px-4 py-5 text-sm text-gray-500 font-medium">{u.email}</td>
                          <td className="px-4 py-5 text-right">
                            <button 
                              onClick={() => deleteUser(u.id)}
                              className="text-[10px] font-black uppercase text-red-500 hover:text-red-700 hover:underline tracking-widest transition-all"
                            >
                              Purge
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
                <Card variant="flat" className="bg-gray-50/50 border-dashed border-2 max-w-md">
                  <form onSubmit={addVehicle} className="flex gap-6 items-end">
                    <div className="flex-1">
                      <Input 
                        label="Vehicle Identifier"
                        value={newVehicleNumber} 
                        onChange={e => setNewVehicleNumber(e.target.value)} 
                        required
                        placeholder="Registration Number"
                      />
                    </div>
                    <Button type="submit" size="md">Add Unit</Button>
                  </form>
                </Card>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-50">
                        <th className="px-4 py-4">Registration Number</th>
                        <th className="px-4 py-4 text-right">Management</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {vehicles.map((v) => (
                        <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-5 font-mono font-bold text-gray-900 tracking-tight">{v.vehicleNumber}</td>
                          <td className="px-4 py-5 text-right">
                            <button 
                              onClick={() => deleteVehicle(v.id)}
                              className="text-[10px] font-black uppercase text-red-500 hover:text-red-700 hover:underline tracking-widest transition-all"
                            >
                              Remove
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
              <div className="space-y-6">
                {/* Filters */}
                <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1 block">Filter Driver</label>
                    <select 
                      value={filterDriver} 
                      onChange={(e) => setFilterDriver(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    >
                      <option value="">All Drivers</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1 block">Filter Status</label>
                    <select 
                      value={filterStatus} 
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    >
                      <option value="">All Statuses</option>
                      <option value="APPROVED">Approved</option>
                      <option value="PENDING">Pending</option>
                      <option value="VERIFIED">Verified</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={() => { setFilterDriver(""); setFilterStatus(""); }}
                      className="text-[10px] font-black uppercase text-gray-400 hover:text-black tracking-widest px-4 py-2"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-50">
                        <th className="px-4 py-4">Start Time</th>
                        <th className="px-4 py-4">End Time</th>
                        <th className="px-4 py-4">Driver & Client</th>
                        <th className="px-4 py-4">Unit</th>
                        <th className="px-4 py-4">Odometer (S/E)</th>
                        <th className="px-4 py-4">Total</th>
                        <th className="px-4 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {getRides().map((ride) => (
                        <tr key={ride.rideId} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-5">
                            <div className="text-[10px] font-bold text-gray-400">
                              {new Date(ride.startRecord.timestamp).toLocaleDateString()}
                            </div>
                            <div className="text-gray-900 font-bold">
                              {new Date(ride.startRecord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="px-4 py-5">
                            {ride.endRecord ? (
                              <>
                                <div className="text-[10px] font-bold text-gray-400">
                                  {new Date(ride.endRecord.timestamp).toLocaleDateString()}
                                </div>
                                <div className="text-gray-900 font-bold">
                                  {new Date(ride.endRecord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </>
                            ) : (
                              <span className="text-[9px] font-black text-blue-500 uppercase animate-pulse">Ongoing</span>
                            )}
                          </td>
                          <td className="px-4 py-5">
                            <div className="font-bold text-gray-900">{ride.driver.name}</div>
                            <div className="text-xs text-gray-500">{ride.clientUser?.name || "-"}</div>
                          </td>
                          <td className="px-4 py-5 font-mono text-sm text-gray-600">
                            {ride.vehicle?.vehicleNumber || "-"}
                          </td>
                          <td className="px-4 py-5 font-mono text-sm text-gray-600">
                            {ride.startRecord.odometer} → {ride.endRecord?.odometer || "..."}
                          </td>
                          <td className="px-4 py-5">
                            <div className="font-black text-gray-900">{ride.totalKms !== undefined ? `${ride.totalKms} km` : "-"}</div>
                            <div className="text-[10px] text-gray-400">{ride.totalHrs ? `${ride.totalHrs} hrs` : ""}</div>
                          </td>
                          <td className="px-4 py-5">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                                ride.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-100' :
                                ride.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                ride.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-100' :
                                ride.status === 'VERIFIED' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                'bg-gray-50 text-gray-700 border-gray-100'
                              }`}>
                                {ride.status}
                              </span>
                              {ride.status === 'PENDING' && (
                                <button 
                                  onClick={() => window.open(`/verify/${ride.startRecord.id}`, '_blank')}
                                  className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:underline"
                                >
                                  Review
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}

