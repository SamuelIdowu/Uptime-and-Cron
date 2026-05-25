import { Resend } from "resend";

let resend: Resend | null = null;

function getResend() {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY is not set. Emails will not be sent.");
      return null;
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendAlertEmail(
  to: string,
  monitorName: string,
  status: "up" | "down" | "late" | "recovered",
  url?: string
) {
  const client = getResend();
  if (!client) return { success: false, error: "RESEND_API_KEY not configured" };

  const isUp = status === "up" || status === "recovered";
  const isRecovered = status === "recovered";
  const subject = `${isRecovered ? "✅ RECOVERED" : isUp ? "✅ UP" : "🚨 DOWN"}: ${monitorName}`;
  
  const html = `
    <div style="font-family: monospace; background-color: #050505; color: #f5f5f5; padding: 24px; border: 1px solid #333;">
      <h2 style="color: ${isUp ? "#22c55e" : "#ef4444"}; margin-top: 0;">
        ${subject}
      </h2>
      <p style="margin-bottom: 24px;">
        Monitor <strong>${monitorName}</strong> is now <strong>${status.toUpperCase()}</strong>.
      </p>
      ${url ? `<p style="font-size: 12px; color: #888;">URL: ${url}</p>` : ""}
      <hr style="border: 0; border-top: 1px solid #333; margin: 24px 0;" />
      <p style="font-size: 11px; color: #666;">
        Sent by SteadyState Monitoring
      </p>
    </div>
  `;

  try {
    await client.emails.send({
      from: "SteadyState <alerts@steadystate.dev>", // Replace with verified domain
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("[RESEND_ERROR]", error);
    return { success: false, error };
  }
}
