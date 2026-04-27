export async function triggerN8nEmail(data: {
  driverName: string;
  driverPhone: string;
  userName: string;
  userEmail: string;
  vehicleNumber: string;
  odometer: number;
  event: "SHIFT_STARTED" | "SHIFT_ENDED";
}) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("N8N_WEBHOOK_URL not configured");
    return;
  }

  try {
    // Calculate IST (UTC + 5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDateObj = new Date(now.getTime() + istOffset);
    
    const istDate = istDateObj.toISOString().split('T')[0]; // YYYY-MM-DD
    const istTime = istDateObj.getUTCHours().toString().padStart(2, '0') + ":" + 
                    istDateObj.getUTCMinutes().toString().padStart(2, '0');

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        istDate,
        istTime,
        timestamp: now.toISOString(),
      }),
    });

    if (!response.ok) {
      console.error("n8n webhook failed:", await response.text());
    }
  } catch (error) {
    console.error("Error triggering n8n webhook:", error);
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
