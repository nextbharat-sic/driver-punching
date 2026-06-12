
import "dotenv/config";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
console.log("Connecting to:", connectionString?.split('@')[1]); // Log the host part only

const pool = new Pool({ connectionString });

async function test() {
  try {
    const client = await pool.connect();
    console.log("Successfully connected to the database");
    const res = await client.query("SELECT current_database();");
    console.log("Current database:", res.rows[0].current_database);
    client.release();
  } catch (err) {
    console.error("Connection error:", err);
  } finally {
    await pool.end();
  }
}

test();
