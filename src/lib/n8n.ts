const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000; // 2 seconds

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function triggerN8nEmail(data: {
  driverName: string;
  driverPhone: string;
  userName: string;
  userEmail: string;
  vehicleNumber: string;
  odometer: number;
  event: "SHIFT_STARTED" | "SHIFT_ENDED";
  totalKms?: number;
  totalHrs?: string;
  startOdo?: number;
  startTime?: string;
  endOdo?: number;
  endTime?: string;
  rideId?: string;
}) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("N8N_WEBHOOK_URL not configured");
    return;
  }

  // Calculate IST (UTC + 5:30)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDateObj = new Date(now.getTime() + istOffset);
  
  const istDate = istDateObj.toISOString().split('T')[0]; // YYYY-MM-DD
  const istTime = istDateObj.getUTCHours().toString().padStart(2, '0') + ":" + 
                  istDateObj.getUTCMinutes().toString().padStart(2, '0');

  const payload = {
    ...data,
    istDate,
    istTime,
    timestamp: now.toISOString(),
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`n8n webhook success on attempt ${attempt}`);
        return; // Success!
      } else {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      if (attempt === MAX_RETRIES) {
        console.error("Max retries reached. n8n notification failed.");
      } else {
        const delay = RETRY_DELAY_MS * attempt; // Exponential-ish backoff
        console.log(`Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }
}

export async function notifyAdminNewDriver(data: {
  name: string;
  phone: string;
}) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
        event: "NEW_DRIVER_REGISTRATION",
      }),
    });
  } catch (error) {
    console.error("Error notifying admin:", error);
  }
}
