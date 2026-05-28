
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as fs from "fs";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const records = await prisma.punchRecord.findMany({
    include: {
      driver: true,
      clientUser: true,
      vehicle: true,
    },
    orderBy: { timestamp: "asc" },
  });

  const rides: Record<string, any> = {};

  for (const record of records) {
    if (!record.rideId) continue;
    if (!rides[record.rideId]) {
      rides[record.rideId] = {
        in: null,
        out: null,
      };
    }
    if (record.type === "IN") {
      rides[record.rideId].in = record;
    } else if (record.type === "OUT") {
      rides[record.rideId].out = record;
    }
  }

  const header = [
    "Date",
    "Regd. No.",
    "Driver",
    "Driver Mobile",
    "Reporting",
    "GPS start",
    "Relieving",
    "GPS end",
    "Total Hrs",
    "Duty Hrs",
    "Extra Hrs",
    "GPS Hrs",
    "Error",
    "Approved Extra Hrs",
    "Start Kms",
    "End Kms",
    "Total Kms",
    "Car",
    "User",
    "ride_id",
  ];

  const rows: string[][] = [header];

  for (const rideId in rides) {
    const { in: inRec, out: outRec } = rides[rideId];
    if (!inRec) continue;

    const date = new Date(inRec.timestamp).toLocaleDateString('en-US');
    const regNo = inRec.vehicle?.vehicleNumber || "";
    const driverName = inRec.driver.name;
    const driverPhone = inRec.driver.phone;
    const reporting = new Date(inRec.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    
    let relieving = "";
    let totalHrs = "";
    let dutyHrs = "12";
    let extraHrs = "";
    let endKms = "";
    let totalKms = "";

    if (outRec) {
      relieving = new Date(outRec.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      const diffMs = outRec.timestamp.getTime() - inRec.timestamp.getTime();
      const diffHrs = diffMs / (1000 * 60 * 60);
      totalHrs = diffHrs.toFixed(2);
      
      const extra = Math.max(0, diffHrs - 12);
      extraHrs = extra > 0 ? extra.toFixed(2) : "";
      
      endKms = outRec.odometer.toString();
      const kms = outRec.odometer - inRec.odometer;
      totalKms = Number.isInteger(kms) ? kms.toString() : kms.toFixed(2);
    }

    const startKms = inRec.odometer.toString();
    const car = regNo;
    const user = inRec.clientUser?.name || "";

    const row = [
      date,
      regNo,
      driverName,
      driverPhone,
      reporting,
      "", // GPS start
      relieving,
      "", // GPS end
      totalHrs,
      dutyHrs,
      extraHrs,
      "", // GPS Hrs
      "", // Error
      "", // Approved Extra Hrs
      startKms,
      endKms,
      totalKms,
      car,
      user,
      rideId,
    ];

    rows.push(row);
  }

  // Export as TSV
  const tsvContent = rows.map(row => row.join("\t")).join("\n");
  fs.writeFileSync("rides_export.tsv", tsvContent);
  console.log("Exported to rides_export.tsv");

  // Export as CSV
  const csvContent = rows.map(row => 
    row.map(cell => {
      const escaped = cell.replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(",")
  ).join("\n");
  fs.writeFileSync("rides_export.csv", csvContent);
  console.log("Exported to rides_export.csv");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
