export async function triggerN8nEmail(data: {
  driverName: string;
  userName: string;
  userEmail: string;
  vehicleNumber: string;
  odometer: number;
}) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("N8N_WEBHOOK_URL not configured");
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
        event: "SHIFT_STARTED",
      }),
    });

    if (!response.ok) {
      console.error("n8n webhook failed:", await response.text());
    }
  } catch (error) {
    console.error("Error triggering n8n webhook:", error);
  }
}
