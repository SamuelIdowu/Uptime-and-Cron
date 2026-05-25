export async function sendSlackAlert(
  webhookUrl: string,
  monitorName: string,
  status: "up" | "down" | "late" | "recovered",
  url?: string
) {
  const isUp = status === "up" || status === "recovered";
  const icon = status === "recovered" ? "✅" : isUp ? "✅" : "🚨";
  const color = isUp ? "#22c55e" : "#ef4444";
  const text = `${icon} *${monitorName}* is now *${status.toUpperCase()}*`;

  const payload = {
    attachments: [
      {
        color,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text,
            },
          },
          url
            ? {
                type: "context",
                elements: [
                  {
                    type: "mrkdwn",
                    text: `URL: ${url}`,
                  },
                ],
              }
            : null,
        ].filter(Boolean),
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack responded with ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error("[SLACK_ERROR]", error);
    return { success: false, error };
  }
}
