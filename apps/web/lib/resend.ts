import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAlertEmail(
  to: string,
  monitorName: string,
  status: "up" | "down" | "late",
  url?: string
) {
  const isUp = status === "up";
  const subject = `${isUp ? "✅ UP" : "🚨 DOWN"}: ${monitorName}`;
  
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
    await resend.emails.send({
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
