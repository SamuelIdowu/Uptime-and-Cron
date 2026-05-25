export async function sendTelegramAlert(
  botToken: string,
  chatId: string,
  monitorName: string,
  status: "up" | "down" | "late" | "recovered",
  url?: string
) {
  const isUp = status === "up" || status === "recovered";
  const icon = status === "recovered" ? "✅" : isUp ? "✅" : "🚨";
  const text = `${icon} *${monitorName}* is now *${status.toUpperCase()}*${url ? `\nURL: ${url}` : ""}`;

  if (!botToken) {
    console.error("[TELEGRAM_ERROR] botToken is not provided.");
    return { success: false, error: "Missing bot token" };
  }

  const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown",
      }),
    });

    if (!response.ok) {
      throw new Error(`Telegram API responded with ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error("[TELEGRAM_ERROR]", error);
    return { success: false, error };
  }
}
